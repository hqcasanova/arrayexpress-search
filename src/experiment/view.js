import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';
import Marionette from 'backbone.marionette';
import File from '../files/model';
import Files from '../files/collection';
import FileStatsView from '../files/view';
import template from './template.html';

export default Marionette.View.extend({
    template: template,

    sortAttrs: null,    //Live DOM collection keeping track of the element containing the sort attribute

    options: {
        activeClass: 'active'       //Class name used for marking the sort attribute's DOM element
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

            //Shortens the name of the experiment.
            truncName: function () {
                return view.truncStr(this.name, view.options.nameCharLimit);
            },

            //Converts the date from ISO 8601 to the European format dd/mm/yyyy
            euRelDate: function () {
                return this.releasedate.split('-').reverse().join(view.options.dateSeparator)
            }
        }
    },

    initialize: function (options) {
        if (options.hasOwnProperty('filesApiUrl')) {
            this.sortAttrs = [];
            this.collection = new Files([], {
                url: options.filesApiUrl,
                model: File,
                rootProp: 'files',
                initStats: {
                    totalProcessed: 0,
                    totalRaw: 0
                }
            });
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
            sryAccession: this.model.get('secondaryaccession'),     //Enables alternative file URL if no raw files found
            fileRoot: `${this.options.experimentUrl}/${expAccession}/files`  
        }).render().el;
        fileStatsEl.appendChild(statsEl);

        //Lazy-loads file data if visible on scroll or resize. 
        this.collection.url += `/${expAccession}`;
        this.listenTo(Backbone, 'visibility:check', this.fetchIfAbove.bind(this));

        this.sortAttrs = this.el.getElementsByClassName(this.options.activeClass);  
    },

    //Fetches the experiment's file data if its corresponding entry in the result list
    //starts to be visible (top of entry)
    fetchIfAbove: function () {
        const isAboveFold = this.el.getBoundingClientRect().top < window.innerHeight;
        const files = this.collection;

        if (!files.isBusy && !files.isFetched && isAboveFold) {
            files.fetch();
            this.stopListening(Backbone);
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