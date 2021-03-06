import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';
import Stats from '../stats/model';

export default Backbone.Collection.extend({   
    rootProp: null,     //Root property for the response
    stats: null,        //Model built with all the response's 1st-level properties
    lastSynced: null,   //Promise from last request
    isFulfilled: null,  //The last GET request was fulfilled
    isFirstFetch: null, //There has been no prior GET request 
    isCacheHit: null,   //Has the collection been cached?

    initialize: function (models, options) {
        const hasRootProp = options.hasOwnProperty('rootProp');
        const hasInitStats = options.hasOwnProperty('initStats');
            
        if (!hasRootProp) {
            throw new Error('Error while initialising collection: no root property name provided.');
        }
        if (!hasInitStats) {
            throw new Error('Error while initialising collection: no initial stats provided.');
        }

        this.stats = new Stats(options.initStats);
        this.url = options.url;
        this.rootProp = options.rootProp;
        this.lastSynced = {};
        this.isFulfilled = true;
        this.isFirstFetch = true;

        //If a request is made to the server, then the data was not found in the cache. Otherwise, it's a cache hit
        this.listenTo(this, 'request', () => {this.isCacheHit = false});
        this.listenTo(this, 'cachesync', () => {this.isCacheHit = true});
    },

    //Creates a model with the search results' stats before they are parsed out to
    //allow correct building of models.
    //NOTE: all collections are contained within a 2nd-level "experiment" property
    parse: function (response) {
        this.stats.set(this.stats.parse(_.omit(response[this.rootProp], 'experiment')));
        return response[this.rootProp].experiment;
    },

    //Aborts any pending request, unmarks stats as new once first successful request
    //has been made. 
    fetch: function (options) {
        let fetched;

        if (!this.isFirstFetch && !this.isFulfilled) {
            this.lastSynced.abort('stale');
        } else if (this.isFirstFetch) {
            this.isFirstFetch = false;
            this.stats.set('id', 1);
        }
        fetched = Backbone.Collection.prototype.fetch.call(this, options);
        this.isFulfilled = false;
        
        this.relayEvents(fetched, options);

        return fetched; 
    },

    //Relays collection events to the stats model
    relayEvents: function (fetched, options) {
        this.stats.trigger('request', this.stats, fetched, options);
        fetched.done(() => {
            this.isFulfilled = true;
            this.stats.trigger('sync', this.stats, this.stats.toJSON(), options);
        }).fail(() => {
            this.stats.trigger('error', this.stats, this.stats.toJSON(), options);
            console.log(`Error while retrieving ${this.rootProp}`); 
        });
    },

    //Since backbone-fetch-cache plugin modifies the promise before returning from fetch,
    //methods such as "abort" are lost. Hence the caching of the promise here, at the lower
    //$.ajax level. Also, enables JSONP requests.
    sync: function (method, collection, options) {
        options.dataType = 'jsonp';
        options.jsonp = 'jsonp';
        options.cache = true;

        this.lastSynced = Backbone.Collection.prototype.sync.call(this, method, collection, options);

        return this.lastSynced;
    }
});