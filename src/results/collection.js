import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';
import Stats from '../stats/model';

export default Backbone.Collection.extend({   
    rootProp: null,     //Root property for the response
    stats: null,        //Model built with all the response's 1st-level properties

    initialize: function (models, options) {
        const hasRootProp = options.hasOwnProperty('rootProp');
        const hasInitStats = options.hasOwnProperty('initStats');

        if (hasInitStats && hasRootProp) {
            this.stats = new Stats(options.initStats);
            this.url = options.url;
            this.rootProp = options.rootProp;
        } else if (hasInitStats) {
            throw new Error('Error while initialising collection: no root property name provided.');
        } else {
            throw new Error('Error while initialising collection: no initial stats provided.');
        }
    },

    //Creates a model with the search results' stats before they are parsed out to
    //allow correct building of models.
    parse: function (response) {
        this.stats.set(this.stats.parse(_.omit(response[this.rootProp], 'experiment')));
        return response[this.rootProp].experiment;
    },

    //Relays collection events to the stats model
    fetch: function (options) {
        const xhr = Backbone.Collection.prototype.fetch.call(this, options);
        
        this.stats.trigger('request', this.stats, xhr, options);
        xhr.done(() => {
            this.stats.trigger('sync', this.stats, this.stats.toJSON(), options);
        }).fail(() => {
            this.stats.trigger('error', this.stats, this.stats.toJSON(), options);
            console.log(`Error while retrieving ${this.rootProp}`); 
        });

        return xhr; 
    }
});