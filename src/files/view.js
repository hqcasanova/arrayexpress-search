import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';
import Marionette from 'backbone.marionette';
import StatsView from '../stats/view.js';
import template from './template.html';

export default StatsView.extend({
    template: template,

    templateContext: {
        target: function () {
            return '';
        },

        url: function () {
            return '';
        }
    } 
});