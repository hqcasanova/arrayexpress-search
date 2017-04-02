import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';
import Marionette from 'backbone.marionette';

export default Marionette.View.extend({
    
    /* DATA */
    collection: null,   //Search results
    model: null,        //Stats from previous search
    
    /* DOM */
    panelEl: null,      //element for the wrapper of all search header's elements
    fieldEl: null,      //element for the search field

    /* STATE */
    isBlankQuery: null, //The search field contains just whitespace
    isNewQuery: null,   //The field contains the same string as the last query

    events: {
        'focus #search-field' : 'collapse',
        'keyup #search-field' : 'searchOnEnter',
        'click #search-button': 'searchOnClick',
        'click .logo'         : 'back'
    },

    options: {
        cacheExpiry: 300     //By default, cached results will age after 5 minutes
    },

    //Model and collection should be passed at instantiation time
    //Collection required to perform search request. Model for keeping track of last
    //query sent successfully
    initialize: function (options) {
        const hasCollection = options.hasOwnProperty('collection');
        const hasModel = options.hasOwnProperty('model');

        if (!hasCollection) {
            throw new Error('Error while initialising input view: no result collection provided.');
        }
        if (!hasModel) {
            throw new Error('Error while initialising input view: no result stats model provided.');
        }

        //Caches DOM elements and resets the text for the search button
        this.panelEl = this.el.querySelector('.panel');
        this.fieldEl = this.panelEl.querySelector('#search-field');
    },

    searchOnEnter: _.debounce(function (event) {
        if (event.keyCode == 13) {
            this.search(this.getQuery());
        }
    }, 250),

    searchOnClick: _.debounce(function (event) {
        this.search(this.getQuery());
    }, 250),

    searchOnRoute: function (query) {
        this.fieldEl.value = query;
        this.search(this.getQuery());
    },

    //Gets field contents once stripped out of redundant whitespace and 
    //updates the field's state.
    getQuery: function () {
        const fieldValue = this.fieldEl.value.trim().replace(/\s+/g, ' ');

        this.isBlankQuery = fieldValue == '';
        this.isNewQuery = this.model.get('query') != fieldValue;

        return fieldValue;
    },
    
    search: function (query) {
        const results = this.collection;
        const isError = !results.isFulfilled;
        

        //Collapses the cover to reveal results if the query is at least not empty.
        //If it's not new, it just reveals the results already available, bypassing
        //a request.
        if (!this.isBlankQuery) {
            this.collapse();
        }
        
        //If new query issued or previous returned an error (to allow repeat on error),
        //it fetches the collection with reset (collection view renders on event).
        //The search field is blurred, barring empty results, to avoid a "sticky" virtual 
        //keyboard on mobile.
        if (!this.isBlankQuery && (this.isNewQuery || isError)) {
            Backbone.history.navigate(query);
            this.model.set('query', query);
            this.fieldEl.blur();
            results.fetch({
                reset: true,
                cache: true,
                expires: this.options.cacheExpiry,
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
        const isCollapsedAlready = this.el.classList.contains('collapsed');
        const that = this;

        //Before making header stick to the top, ensures height transition has ended and
        //falls back to no transition for browsers not supporting the standard event.
        if (isCollapse) {
            if (Marionette.transitionEvnt && !isCollapsedAlready) {
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
    },

    //Alias of the above for revealing the result section
    collapse: function () {
        this.toggleHeader(true);
    }
});