import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';
import Marionette from 'backbone.marionette';

export default Marionette.CollectionView.extend({
    tagName: 'ol',
    className: 'result-list',
    attributes: {start: '1'},
    childViewOptions: {
        tagName: 'li',
        className: 'result'
    },
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
    viewComparator: function (res1, res2) {
        const res1value = this.scalar(res1.get(this.currSortAttr));
        const res2value = this.scalar(res2.get(this.currSortAttr));
        const lacksAttr = (typeof res1value === 'undefined') || 
                          (typeof res2value === 'undefined');
        
        if ((res1value == res2value) || lacksAttr) {
            return 0;
        } 

        if ((res1value > res2value) ^ this.isDescending) {
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
    }
});