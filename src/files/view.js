import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';
import Marionette from 'backbone.marionette';
import StatsView from '../stats/view.js';
import template from './template.html';

export default StatsView.extend({
    template: template,

    initialize: function (options) {
        const hasFileRoot = options.hasOwnProperty('fileRoot');
        const hasSecAccCode = options.hasOwnProperty('secAccCode');
        const hasSecAccUrl = options.hasOwnProperty('secAccUrl');

        if (!hasFileRoot) {
            throw new Error('Error while initialising file stats view: no root URL for file retrieval provided.');;
        }
        if (!hasSecAccCode) {
            throw new Error('Error while initialising file stats view: no secondary accession code provided.');;
        }
        if (!hasSecAccUrl) {
            throw new Error('Error while initialising file stats view: no secondary accession URL provided.');;
        }

        options.secAccCode = options.secAccCode && options.secAccCode.slice(0, 3);
    },

    templateContext: function () {
        const fileRoot = this.options.fileRoot;
        const secUrl = this.options.secAccUrl;
        const secCode = this.options.secAccCode;
        const stats = this.model;

        return {
            url: function (typeFile) {
                const total = stats.getTotal(typeFile);
                
                if (total > 1) {
                    return `${fileRoot}/${typeFile}`;
                } else if (total == 1) {
                    return this.filesByCat[typeFile][0].get('url');
                } else if (secUrl && typeFile == 'raw') {
                    return secUrl;
                } else {
                    return 'javascript:void(0)';
                }
            },

            linkClass: function (typeFile) {
                const total = stats.getTotal(typeFile);
                
                if (total > 1) {
                    return 'link';
                } else if (total == 1) {
                    return 'download';
                } else if (secCode && typeFile == 'raw') {
                    return secCode;
                } else {
                    return 'no-link';
                }
            },

            rawCount: function () {
                if (secUrl && !this.totalRaw) {
                    return secCode;
                } else {
                    return this.totalRaw;
                }
            }
        }
    }
});