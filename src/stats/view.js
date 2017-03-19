import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';
import Marionette from 'backbone.marionette';

export default Marionette.View.extend({
    className: 'stats hidden',

    modelEvents: {
        'sync'      : 'render showStats',
        'request'   : 'hideStats'
    },

    onRender: function () {
        const isEmpty = !this.model.get('total');            
        this.el.classList.toggle('empty', isEmpty);
    },

    hideStats: function () {
        this.el.classList.add('hidden');
    },

    showStats: function () {
        this.el.classList.remove('hidden');
    }
});