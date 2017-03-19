import './styles.less';
import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';
import Marionette from 'backbone.marionette';
import Experiment from './experiment/model';
import Results from './results/collection';
import HeaderView from './header/view';
import StatsView from './stats/view';
import resultStatsTmpl from './results/stats.html';
import ResultsView from './results/view';
import LoadingView from './loading/view';

//Application class
const Search = Marionette.Application.extend({
    results: null,      //search results collection

    //Enables JSONP requests globally and sets up results collection.
    //Also broadcasts scroll offset of bottom edge of visible page.     
    onBeforeStart: function (app, options) {
        const defaultSync = Backbone.sync;

        Backbone.sync = function (method, collection, options) {
            options.dataType = 'jsonp';
            options.jsonp = 'jsonp';
            options.cache = true;
            return defaultSync(method, collection, options);
        };

        this.results = new Results([], {
            url: options.rootUrl + options.apiPath + options.searchPath,
            model: Experiment,
            rootProp: 'experiments',
            initStats: {
                totalAssays: 0,
                totalSamples: 0
            }
        });

        window.addEventListener('scroll', _.throttle(function () {
            _.defer(function () {Backbone.trigger('scroll')});
        }), 250);
    },

    //Sets up view scaffolding around existing markup
    onStart: function (app, options) {
        const resultsEl = document.querySelector('.results');
        
        //Sets up search input and prevents scroll when the app cover is on display
        const headerView = new HeaderView({
            el: document.querySelector('.search'),
            model: this.results.stats,
            collection: this.results
        });
        this.listenTo(headerView, 'header:collapse', this.preventScroll);
        
        //Scaffolds results area for loading state
        const LoadingWithEmail = LoadingView(options.supportEmail, options.waitDelay * 1000);
        new LoadingWithEmail({
            el: resultsEl,
            collection: this.results,
            waitDampener: true
        }).render();

        //Sets up results area = stats + list
        const statsEl = new StatsView({
            model: this.results.stats,
            template: resultStatsTmpl
        }).render().el;
        const listEl = new ResultsView({
            collection: this.results,
            childViewOptions: {
                experimentUrl: options.rootUrl + options.searchPath,
                filesApiUrl: options.rootUrl + options.apiPath + options.filesPath,
                descCharLimit: options.descCharLimit,
                nameCharLimit: options.nameCharLimit,
                dateSeparator: options.dateSeparator,
                loadingClass: LoadingWithEmail
            },
            emptyViewOptions: {
                model: this.results.stats,
                templateContext: {email: options.curatorEmail}
            },
            defaultSortAttr: options.sortAttr,
            defaultSortDir: options.sortDir
        }).render().el;
        resultsEl.appendChild(statsEl);
        resultsEl.appendChild(listEl);
    },

    preventScroll: function (isCollapsed) {
        document.body.classList.toggle('no-scroll', !isCollapsed);
    }
});

//Instance with app-wide options
const search = new Search().start({
    rootUrl: 'https://www.ebi.ac.uk/arrayexpress',
    apiPath: '/json/v3',
    searchPath: '/experiments',         //Endpoint for experiment meta-data
    filesPath: '/files',                //Endpoint for an experiment's file meta-data
    descCharLimit: 250,                 //Character limit for experiment description in search results
    nameCharLimit: 80,                  //Character limit for experiment name 
    dateSeparator: '/',                 //Dates will be of format dd/mm/yyyy
    curatorEmail: 'anjaf@ebi.ac.uk',    //Email used in suggestions when no results found
    supportEmail: 'support@ebi.ac.uk',  //Email used in the event of a request failure
    waitDelay: 4,                       //Seconds before the user is reminded to wait
    sortAttr: 'releasedate',            //By default, results sorted by experiment's release date.
    sortDir: 'descending'               //By default, values will be arranged from largest to smallest
});