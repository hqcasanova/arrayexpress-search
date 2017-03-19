import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';
import Marionette from 'backbone.marionette';
import template from './template.html';
 
//emailDef: Email address used by default when monitored request fails
//waitDelay: Milliseconds before a further message is shown
export default function (emailDef = '', waitDelay = 3000) {
    return Marionette.View.extend({
        template: template,

        //If no email given, the contact message will not be shown
        templateContext: {
            email: emailDef,        
        },

        //If the request takes longer than a waiting threshold, a message will be
        //displayed.
        options: {
            waitDampener: false      
        },

        modelEvents: {
            'request'   : 'showLoading hideError',
            'sync'      : 'hideLoading showLoaded',
            'error'     : 'hideLoading showError',
        },

        initialize: function (options) {
            if (options.hasOwnProperty('collection')) {
                if (this.collection.hasOwnProperty('stats')) {
                    this.model = this.collection.stats;
                    this.timer = null;
                } else {
                    throw new Error('Error while initialising loading view: the collection provided must be of type Results.');   
                }
            } else {
                throw new Error('Error while initialising loading view: no results collection provided.');
            }      
        },

        showLoading: function () {
            this.el.classList.add('loading');

            if (this.options.waitDampener) {
                this.timer = setTimeout(() => { 
                    this.el.classList.add('wait'); 
                }, waitDelay);
            }
        },

        hideLoading: function () {
            this.el.classList.remove('loading');
            this.el.classList.remove('wait');

            if (this.options.waitDampener) { 
                clearTimeout(this.timer);
            }
        },

        showLoaded: function () {
            this.el.classList.add('loaded');

            //The collection is hidden from view until fully loaded from the server. This
            //may have repercussions on the collection's children lifecycle as a view. Hence
            //this new event. See ../results/view.js.
            this.collection.trigger('loaded');
        },

        showError: function () {
            this.el.classList.add('error');
        },

        hideError: function () {
            this.el.classList.remove('error');
        }
    });
}

    