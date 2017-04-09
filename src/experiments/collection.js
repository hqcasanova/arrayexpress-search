import $ from 'jquery';
import _ from 'underscore';
import Results from '../results/collection';
import Experiment from '../experiment/model';

export default Results.extend({
    model: Experiment,

    initialize: function (models, options) {
        const hasSecAccCodes = options.hasOwnProperty('secAccCodes');
        const hasSecAccUrls = options.hasOwnProperty('secAccUrls');
        const secAccMap = {};

        if (!hasSecAccCodes) {
            throw new Error('Error while initialising collection: no priority list of three-letter secondary accession codes provided.');
        }
        if (!hasSecAccUrls) {
            throw new Error('Error while initialising collection: no list of URLs for secondary accession codes provided.');
        }

        Results.prototype.initialize.call(this, models, _.extend(options, {
            rootProp: 'experiments',
            initStats: {
                totalAssays: 0,
                totalSamples: 0
            }
        }));

        //Creates a lookup map of secondary accession codes to priority value
        options.secAccCodes.forEach(function (code, index) {
            secAccMap[code] = index;
        });

        //Shares the secondary accession code map and URLs across all model instances
        this.model = this.model.extend({
            secAccMap: secAccMap,
            secAccUrls: options.secAccUrls
        });
    }
});