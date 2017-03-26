import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';
import Marionette from 'backbone.marionette';

export default Marionette.View.extend({
    panelEl: null,      //DOM element for the wrapper of all search header's elements
    fieldEl: null,      //DOM element for the search field

    events: {
        'keyup #search-field' : 'searchOnEnter',
        'click #search-button': 'search',
        'click .logo'         : 'back'
    },

    initialize: function (options) {
        const hasCollection = options.hasOwnProperty('collection');
        const hasModel = options.hasOwnProperty('model');

        //Collection required to perform search request. Model for keeping track of last
        //query sent successfully
        if (hasCollection && hasModel) {
            this.panelEl = this.el.querySelector('.panel');
            this.fieldEl = this.panelEl.querySelector('#search-field');
            this.fieldEl.focus();

        //Model and collection should be passed at instantiation time
        } else if (hasModel) {
            throw new Error('Error while initialising input view: no result collection provided.');
        } else {
            throw new Error('Error while initialising input view: no result stats model provided.');
        }
    },

    searchOnEnter: function (event) {
        (event.keyCode == 13) && this.search();
    },

    search: function () {
        const query = this.fieldEl.value.trim().replace(/\s+/g, ' ');
        const results = this.collection;
        const stats = this.model;       //stats from previous search

        //Reveals results section
        if (query) {
            this.toggleHeader(true);
        }

        //If new query issued or previous returned no result (to allow repeat on error),
        //it fetches the collection with reset (collection view renders on event).
        //The search field is blurred, barring empty results, to avoid a "sticky" virtual 
        //keyboard on mobile.
        if ((query != '') && ((stats.get('query') != query) || (stats.get('total') == 0))) {
            stats.set('query', query);
            this.fieldEl.blur();
            results.fetch({
                reset: true,
                data: {keywords: query.replace(/\s/g, '+')},
                success: (results) => {!results.length && this.fieldEl.focus()}
            });
        } 
    },

    //Goes back to the top of the page of results
    back: function () {
        this.toggleHeader(false);
    },

    toggleHeader: function (isCollapse) {
        const that = this;

        //Before making header stick to the top, ensures height transition has ended and
        //falls back to no transition for browsers not supporting the standard event.
        if (isCollapse) {
            if (Marionette.transitionEvnt && !this.el.classList.contains('collapsed')) {
                this.el.addEventListener(Marionette.transitionEvnt, function self () {
                    that.el.removeEventListener(Marionette.transitionEvnt, self);
                    that.panelEl.classList.add('sticky');        
                });
            } else if (!this.el.classList.contains('collapsed')) {
                that.panelEl.classList.add('sticky');
            }

        //Goes back to previous visual state straight away
        } else {
            this.panelEl.classList.remove('sticky');
        }

        this.el.classList.toggle('collapsed', isCollapse);
        this.trigger('header:collapse', isCollapse);
    }
});