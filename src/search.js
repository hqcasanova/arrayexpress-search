import 'font-awesome-webpack';
import './styles.less';
import 'backbone-fetch-cache';
import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';
import Marionette from 'backbone.marionette';
import Experiments from './experiments/collection';
import HeaderView from './header/view';
import ExperimentsView from './experiments/view';
import LoadingView from './loading/view';

//Application class
const Search = Marionette.Application.extend({
    results: null,      //search results collection

    onBeforeStart: function (app, options) {

        //Sets up search results collection
        this.results = new Experiments([], {
            url: options.rootUrl + options.apiPath + options.searchPath,
            secAccCodes: options.secAccCodes,
            secAccUrls: options.secAccUrls
        });

        //Makes the supported transition event name globally available
        Marionette.transitionEvnt = this.getTransitionEvnt();

        //Makes capitalisation convenience method globally available
        _.capitalise = this.capitalise;

        //Listens to screen resize and scrolling events to check the visibility
        //of UI parts before any further action
        window.addEventListener('scroll', _.throttle(function () {
            Backbone.trigger('window:scroll');
        }), 300);
        window.addEventListener('resize', _.debounce(function () {
            Backbone.trigger('window:resize');
        }), 400);

        //Irons out differences between browsers for requestAnimationFrame
        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = (function() {
                return window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function(callback) {
                    window.setTimeout(callback, 0);
                };
            })();
        }
    },

    //Detects the supported transition event name
    getTransitionEvnt: function () {
        const el = document.createElement('div');
        const transitions = {
            'transition':'transitionend',
            'MozTransition':'transitionend',
            'WebkitTransition':'webkitTransitionEnd'
        };

        for (let evntName in transitions) {
            if (transitions.hasOwnProperty(evntName) && el.style[evntName] !== undefined) {
                return transitions[evntName];
            }
        }

        return null;
    },

    //Capitalises first letter
    capitalise: function (string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },

    //Sets up view scaffolding around existing markup
    onStart: function (app, options) {
        const resultsEl = document.querySelector('.experiments');

        //Sets up search input and prevents scroll when the app cover is on display
        const headerView = new HeaderView({
            el: document.querySelector('.search'),
            model: this.results.stats,
            collection: this.results,
            cacheExpiry: options.cacheExpiry
        });
        this.listenTo(headerView, 'header:collapse', this.preventScroll);

        //Allows direct navigation to search results and history
        const router = new Marionette.AppRouter({
            appRoutes: {':query': 'searchOnRoute'},
            controller: headerView
        });
        
        //Scaffolds results area for loading state
        const LoadingWithEmail = LoadingView(
            options.supportEmail, 
            options.waitDelay * 1000
        );
        new LoadingWithEmail({
            el: resultsEl,
            collection: this.results,
            waitDampener: true
        }).render();

        //Sets up results area = stats + list
        const listView = new ExperimentsView({
            collection: this.results,
            childViewOptions: {
                experimentUrl: options.rootUrl + options.searchPath,
                filesApiUrl: options.rootUrl + options.apiPath + options.filesPath,
                descCharLimit: options.descCharLimit,
                nameCharLimit: options.nameCharLimit,
                dateSeparator: options.dateSeparator,
                loadingClass: LoadingWithEmail,
                cacheExpiry: options.cacheExpiry
            },
            emptyViewOptions: {
                templateContext: {
                    email: options.curatorEmail,
                    helpUrl: options.rootUrl + options.helpPath
                }
            },
            defaultSortAttr: options.sortAttr,
            defaultSortDir: options.sortDir
        });
        resultsEl.appendChild(listView.getStatsView().render().el);
        resultsEl.appendChild(listView.render().el);

        //From now on, routes are handled and changes listened to.
        Backbone.history.start();
    },

    preventScroll: function (isCollapsed) {
        document.body.classList.toggle('no-scroll', !isCollapsed);
    }
});

//Instance with app-wide options
const search = new Search().start({
    rootUrl: 'https://www.ebi.ac.uk/arrayexpress',
    helpPath: '/help/how_to_search.html',   //Official help guide for search
    apiPath: '/json/v3',                    //JSON and JSONP endpoint
    searchPath: '/experiments',             //Endpoint for experiment meta-data
    filesPath: '/files',                    //Endpoint for an experiment's file meta-data
    cacheExpiry: 3600,                      //Expiry time in seconds for cached data on localstorage
    descCharLimit: 250,                     //Character limit for experiment description in search results
    nameCharLimit: 80,                      //Character limit for experiment name 
    dateSeparator: '/',                     //Dates will be of format dd/mm/yyyy
    curatorEmail: 'anjaf@ebi.ac.uk',        //Email used in suggestions when no results found
    supportEmail: 'support@ebi.ac.uk',      //Email used in the event of a request failure
    waitDelay: 4,                           //Seconds before the user is reminded to wait
    sortAttr: 'releasedate',                //By default, results sorted by experiment's release date.
    sortDir: 'descending',                  //By default, values will be arranged from largest to smallest
    secAccCodes: [                          //3-letter code prefixes of secondary accessions by priority
        'ERP', 'SRP', 'EGA', 'GSE'          //NOTE 1: 0 index corresponds to highest priority.
    ],                                      //NOTE 2: To be used for experiments whose raw files are indexed outside ArrayExpress only.        
    secAccUrls: [                           //URLs corresponding to the above accession codes
        'http://www.ebi.ac.uk/ena/data/view/',
        'http://www.ebi.ac.uk/ena/data/view/',
        'https://www.ebi.ac.uk/ega/studies/',
        'https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc='
    ]
});