import $ from 'jquery';
import _ from 'underscore';
import Results from '../results/collection';
import File from './model';

export default Results.extend({
    model: File,        
    filesByCat: null,       //Map of files in each category (raw or processed)    
    isFetched: null,        //Flags whether the collection has been fetched at least once
    isBusy: null,           //Indicates a request is in progress  

    initialize: function (models, options) {
        Results.prototype.initialize.call(this, models, options);
        this.filesByCat = {};
        this.stats.set('filesByCat', this.filesByCat);

        this.isFetched = false;
        this.isBusy = false;

        this.on('request', () => {this.isBusy = true});
        this.on('sync', () => {this.isBusy = false});
        this.on('error', () => {this.isBusy = false});
    },

    parse: function (response) {
        response = Results.prototype.parse.call(this, response);
        return response.file;
    },

    
    //Updates stats and fetched state before triggering the "sync" event
    fetch: function (options = {}) {
        const currSuccess = options.success;

        options.success = (collection, response, fetchOpts) => {
            this.setStats('processed');
            this.setStats('raw');
            this.isFetched = true;
            currSuccess && currSuccess(collection, response, fetchOpts);
        }

        return Results.prototype.fetch.call(this, options);
    },

    //Works out file totals for the stats model and the map of files by category
    setStats: function (typeFile) {
        const files = this.where({kind: typeFile});

        this.filesByCat[typeFile] = files;
        this.stats.setTotal(files.length, typeFile);
    }
});