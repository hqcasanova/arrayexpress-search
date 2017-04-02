import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';
import Marionette from 'backbone.marionette';
import ExperimentView from '../experiment/view';
import emptyTemplate from '../experiment/empty.html';
import idleTemplate from '../experiment/idle.html';

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

export default Marionette.CollectionView.extend({
    tagName: 'ol',
    attributes: {start: '1'},
    childView: ExperimentView,
    childViewOptions: {
        tagName: 'li',
        className: 'result'
    },
    emptyView: EmptyExp,    //Used for the idle state too (no request made yet).
    reorderOnSort: true,    //Reorders DOM elements instead of re-rendering the whole view 
    currSortAttr: null,     //Criterion attribute which the collection is currently sorted by
    isDescending: null,     //Are values sorted from the largest to the smallest?   

    options: {
        descendingClass: 'descending'      //Name of the class used to mark view's sorting direction.
    },

    collectionEvents: {
        'reset': 'resetSorting'
    },

    events: {
        'click .sortable': 'sort'
    },        

    initialize: function (options) {
        const opts = this.options;
        const hasSortAttr = opts.hasOwnProperty('defaultSortAttr');
        const hasDirection = opts.hasOwnProperty('defaultSortDir');
        const hasChildOpts = opts.hasOwnProperty('childViewOptions');

        //Normalises default direction to boolean and sets sorting parameters 
        //according to options. If defaultSortDir's format is non-compliant 
        //(eg a number), falls back to ascending.
        if (hasSortAttr && hasDirection) {
            opts.defaultSortDir = opts.defaultSortDir === opts.descendingClass; 
            this.resetSorting(); 
        } else if (hasDirection) {
            throw new Error('Error while initialising result view: no default sorting criterion provided.');
        } else {
            throw new Error('Error while initialising result view: no default sorting direction provided.');
        }

        //Merges child view options objects occurring both at declaration and 
        //instantiation time, giving priority to the former.
        if (hasChildOpts) {
            this.childViewOptions = _.defaults(
                opts.childViewOptions, 
                this.__proto__.childViewOptions
            );
        }

        //Because the collection is hidden until fully loaded (including stats),
        //any "attach" or "render:children" event will be triggered when the browser still
        //has no rendering information on the collection's children. Effectively, they will
        //only be visible once the collection is marked as "loaded" by the Loading view. 
        //See ../loading/view.js
        this.listenTo(this.collection, 'loaded', this.onVisible);
    },

    //Sets sorting properties to defaults
    resetSorting: function () {
        const opts = this.options;

        this.currSortAttr = opts.defaultSortAttr;
        this.isDescending = opts.defaultSortDir;
        this.el.classList.toggle(opts.descendingClass, this.isDescending);
    },

    //Comparator compatible with both numerical and string values that allows reversal.
    //Harnesses Backbone's support for one-on-one comparisons. Array values will be
    //compared on the basis of their first element.
    viewComparator: function (exp1, exp2) {
        const exp1value = this.scalar(exp1.get(this.currSortAttr));
        const exp2value = this.scalar(exp2.get(this.currSortAttr));
        const lacksAttr = (typeof exp1value === 'undefined') || 
                          (typeof exp2value === 'undefined');
        
        if ((exp1value == exp2value) || lacksAttr) {
            return 0;
        } 

        if ((exp1value > exp2value) ^ this.isDescending) {
            return 1;
        } else {
            return -1;
        }
    },

    //Allows the normalisation of model values to non-array ones
    scalar: function (value) {
        if (Array.isArray(value)) {
            return value[0];
        } else {
            return value;
        }
    },

    sort: function (event) {
        const newSortAttr = event.currentTarget.dataset.attribute;
        
        //Toggles the sorting direction if clicking on same attribute for a second time
        if (newSortAttr == this.currSortAttr) {
            this.isDescending = !this.isDescending;
        } else {
            this.isDescending = this.options.defaultSortDir;
        }
        this.el.classList.toggle(this.options.descendingClass, this.isDescending);

        this.currSortAttr = newSortAttr;
        this.resortView();
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
    }
});