import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';
import Marionette from 'backbone.marionette';
import Files from '../files/collection';
import FileStatsView from '../files/view';
import template from './template.html';
import singleTemplate from './single.html';

export default Marionette.View.extend({
    sortAttrs: null,    //Live DOM collection keeping track of the element containing the sort attribute

    options: {
        activeClass: 'active',      //Class name used for marking the sort attribute's DOM element
        cacheExpiry: 300            //By default, cached files will age after 5 minutes
    },     

    templateContext: function () {
        const view = this;

        return {

            //URL for the link to the experiment's description web page
            experimentUrl: view.options.experimentUrl,

            //Assumes the first description instance as the representative one and
            //shortens it.
            truncDescription: function () {
                return view.truncStr(view.stripHTML(this.description[0].text));
            },

            //Removes erroneous break tags and adds a rel="external" attribute to anchors
            fixedDescription: function () {
                const sanitised = this.description[0].text.replace(/<\/br>/gi, '');
                return sanitised.replace(/href/g, 'rel="external" href');
            },

            //Shortens the name of the experiment.
            truncName: function () {
                return view.truncStr(this.name, view.options.nameCharLimit);
            },

            //Converts the date from ISO 8601 to the European format dd/mm/yyyy
            euDate: function (propName = 'releasedate') {
                return this[propName].split('-').reverse().join(view.options.dateSeparator);
            },

            //Gets number of samples from the result's stats for a single experiment search
            numSamples: function () {
                return view.model.collection.stats.get('totalSamples');
            },

            contactClass: function (email) {
                if (email) {
                    return 'email';
                } else return 'no-link';
            },

            //Capitalises the contact's role and shows it only if applicable
            showCapitalised: function (value) {
                return _.capitalise(this.show(value, ':'));
            },

            //Only displays the model's value if not null and encloses it with passed in
            //characters, if at all.
            show: function (value, right = '', left = '') {
                if (value) {
                    return `${left}${value}${right}`;
                } else {
                    return '';
                }
            }
        }
    },

    //Uses a different template when displaying a single experiment (akin to an "experiment page").
    getTemplate: function () {
        if (this.model.collection.length == 1) {
            return singleTemplate;
        } else {
            return template;
        }
    },

    initialize: function (options) {
        if (options.hasOwnProperty('filesApiUrl')) {
            this.sortAttrs = [];
            this.collection = new Files([], {
                url: options.filesApiUrl
            });

            //Auto-destroys when a new search is performed
            this.listenTo(this.model.collection, 'request', this.destroy);

        } else {
            throw new Error('Error while initialising experiment view: no file API URL provided.');;
        }          
    },

    stripHTML: function (html) {
        const el = document.createElement("div");
        
        el.innerHTML = html;
        return el.textContent;
    },

    truncStr: function (string, charLimit = this.options.descCharLimit) {
        if (string.length <= charLimit) {
            return string;
        } else {
            return string.substring(0, charLimit) + '...';
        }
    },

    onRender: function () {
        const fileStatsEl = this.el.querySelector('.experiment-files');
        const expAccession = this.model.get('accession');
        const files = this.collection;
        
        //Shows feedback while the experiment's file data is loading
        new this.options.loadingClass({
            el: fileStatsEl,
            collection: files,
        }).render();

        //Adds counts for raw and processed files
        const statsEl = new FileStatsView({
            model: files.stats,
            secAccCode: this.model.get('secondaryaccession')[0],
            secAccUrl: this.model.get('secondaryaccessionurl')[0],     //Enables alternative file URL if no raw files found
            fileRoot: `${this.options.experimentUrl}/${expAccession}/files`  
        }).render().el;
        fileStatsEl.appendChild(statsEl);

        //Lazy-loads file data if visible on scroll or resize. 
        this.collection.url += `/${expAccession}`;
        this.listenTo(Backbone, 'window:scroll', this.fetchIfVisible);
        this.listenTo(Backbone, 'window:resize', this.fetchIfVisible);

        this.sortAttrs = this.el.getElementsByClassName(this.options.activeClass);  
    },

    //Fetches the experiment's file data if its corresponding entry in the result list
    //starts to be visible (top of entry)
    fetchIfVisible: function () {
        const isSingleExp = this.model.collection.length == 1;
        const files = this.collection;

        //To minimize re-flow, only compare DOM dimensions if file data hasn't been 
        //requested yet.
        if (!files.isBusy && !files.isFetched) {
            requestAnimationFrame(() => {
                const dims = this.el.getBoundingClientRect();

                //Only fetch the files for experiments within the viewport
                if ((dims.bottom >= 0) && (dims.top < this.options.windowHeight)) {
                    files.fetch();
                    this.stopListening(Backbone);
                }
            });
        }
    },

    //Updates the element corresponding to the sort attribute as active
    highlightSortEl: function (sortAttr) {
        const activeClass = this.options.activeClass;
        const currActiveEl = this.sortAttrs[0];

        if (currActiveEl) {
            currActiveEl.classList.remove(activeClass);
        }
        try {
            this.el.querySelector(`[data-attribute="${sortAttr}"]`).classList.add(activeClass);
        } catch (exception) {
            console.log(`The experiment ${this.model.get('accession')} seems to lack a "${sortAttr}" attribute`);
        }
    }
});