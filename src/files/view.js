import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';
import Marionette from 'backbone.marionette';
import StatsView from '../stats/view.js';
import template from './template.html';

export default StatsView.extend({
    template: template,

    //Default map reducing secondary accession codes to URL according to highest priority
    //(higher array index means higher priority).
    options: {
        sryUrlMap: [
            {code: 'GSE', url: 'https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc='},
            {code: 'EGA', url: 'https://www.ebi.ac.uk/ega/studies/'},
            {code: 'SRP', url: 'http://www.ebi.ac.uk/ena/data/view/'},
            {code: 'ERP', url: 'http://www.ebi.ac.uk/ena/data/view/'}
        ]
    },

    initialize: function (options) {
        const hasFileRoot = options.hasOwnProperty('fileRoot');
        const hasSryAccession = options.hasOwnProperty('sryAccession');

        if (!hasFileRoot) {
            throw new Error('Error while initialising file stats view: no root URL for file retrieval provided.');;
        }
        if (!hasSryAccession) {
            throw new Error('Error while initialising file stats view: no secondary accession provided.');;
        }
    },

    templateContext: function () {
        const fileRoot = this.options.fileRoot;
        const sryUrl = this.getSryUrl();
        const stats = this.model;

        return {
            target: function (typeFile) {
                if (stats.getTotal(typeFile) > 1) {
                    return '_blank';
                } else if (sryUrl) {
                    return '_blank';
                } else {
                    return '_self';
                }
            },

            url: function (typeFile) {
                const total = stats.getTotal(typeFile);
                
                if (total > 1) {
                    return `${fileRoot}/${typeFile}`;
                } else if (total == 1) {
                    return this.filesByCat[typeFile][0].get('url');
                } else if (sryUrl) {
                    return sryUrl;
                } else {
                    return 'javascript:void(0)';
                }
            },

            linkClass: function (typeFile) {
                const total = stats.getTotal(typeFile);
                
                if (total > 1) {
                    return 'multiple';
                } else if (total == 1) {
                    return 'single';
                } else if (sryUrl) {
                    return 'multiple';
                } else {
                    return 'none';
                }
            }
        }
    }, 

    //Uses secondary accession information to generate an alternative URL if no entries
    //for raw files exist in ArrayExpress.
    //TODO: implement logic according to priority 3-letter-code-to-URL map.
    getSryUrl: function () {
        return '';
    }
});