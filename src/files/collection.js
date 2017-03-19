import $ from 'jquery';
import _ from 'underscore';
import Results from '../results/collection';
import File from './model';

export default Results.extend({
    model: File,
    isFetched: null,       //Flags whether the collection has been fetched at least once
    isBusy: null,          //Indicates a request is in progress  

    initialize: function (models, options) {
        Results.prototype.initialize.call(this, models, options);
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

    //Works out file totals for the stats model before triggering the "sync" event
    //and updates the fetched state of the collection.
    fetch: function (options = {}) {
        const currSuccess = options.success;

        options.success = (collection, response, fetchOpts) => {
            const totalProcessed = this.where({kind: 'processed'}).length;
            const totalRaw = this.where({kind: 'raw'}).length;
            
            this.stats.set({
                totalProcessed: totalProcessed,
                totalRaw: totalRaw,
                total: totalProcessed + totalRaw
            });

            this.isFetched = true;
            currSuccess && currSuccess(collection, response, fetchOpts);
        }

        return Results.prototype.fetch.call(this, options);
    }
});