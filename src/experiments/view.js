import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';
import Marionette from 'backbone.marionette';
import Experiments from './collection';
import ExperimentView from '../experiment/view';
import emptyTemplate from '../experiment/empty.html';
import idleTemplate from '../experiment/idle.html';
import StatsView from '../stats/view';
import statsTemplate from './template.html';
import Results from '../results/view';

const EmptyExp = Marionette.View.extend({
    /* DATA */
    model: null,        //Result stats. Marked as new unless a request already done.

    /* DOM */
    tagName: 'li',
    templateContext: {
        email: '',      //If no email given, the contact message will not be shown
    },

    //Shows suggested examples if no request has been made yet (idle state). Otherwise,
    //it lists possible reasons for an empty result.
    getTemplate: function () {
        if (this.model.isNew()) {
            return idleTemplate;
        } else {
            return emptyTemplate;
        }
    }
});

export default Results.extend({
    childView: ExperimentView,
    emptyView: EmptyExp,    //Used for the idle state too (no request made yet).

    initialize: function (options) {
        Results.prototype.initialize.call(this, options);

        if (this.results instanceof Experiments) {
            throw new Error('Error while initialising Experiments view: invalid collection type.');
        }

        //Because the collection is hidden until fully loaded (including stats),
        //any "attach" or "render:children" event will be triggered when the browser still
        //has no rendering information on the collection's children. Effectively, they will
        //only be visible once the collection is marked as "loaded" by the Loading view. 
        //See ../loading/view.js
        this.listenTo(this.collection, 'loaded', this.onVisible);

        //The stats are needed to enable access to api version information to be included in
        //the generated email to the curator.
        this.options.emptyViewOptions.model = this.collection.stats;
    },

    //Highlights the DOM element corresponding to the sort attribute for every experiment view
    //Bypasses scroll and loads file data for those experiments sitting above the fold 
    //after reorder.
    onReorder: function () {
        this.children.each((expView) => {
            expView.highlightSortEl(this.currSortAttr);
            expView.fetchIfAbove();
        });
    },

    //Loads file data for those experiments already above the fold when rendered 
    //for the first time.
    onVisible: function () {
        !this.isEmpty() && this.children.each((expView) => {
            expView.fetchIfAbove();
        });
    },

    //Instantiates stats view using the experiments' stats
    getStatsView: function () {
        return new StatsView({
            model: this.collection.stats,
            template: statsTemplate
        });
    }
});