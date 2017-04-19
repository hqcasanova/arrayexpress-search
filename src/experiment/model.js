import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';

export default Backbone.Model.extend({
    secAccMap: null,    //Lookup map of secondary accession codes to priority value
    secAccUrls: null,   //Urls corresponding to the accession codes above

    defaults: function () {
        return {
            accession: 'E-MEXP-00',
            name: 'empty',
            description: {text: 'none'},
            secondaryaccession: [],         //secondary accession codes
            secondaryaccessionurl: []       //URLs for secondary accession codes above
        }
    },

    //Flags experiments that lack the "experimenttype" property and adds pointer to
    //secondary accession URLs if applicable.
    parse: function (response) {
        const hasType = response.hasOwnProperty('experimenttype');
        const hasSecAcc = response.hasOwnProperty('secondaryaccession');

        if (!hasType) {
            console.log(`Experiment with ID ${response.id} and accession ${response.accession} has no "experimenttype" property set`);
        }
        response.hasType = hasType;
        response.hasBiblio = response.hasOwnProperty('bibliography');
        response.hasSubmitDate = response.hasOwnProperty('submissiondate');

        if (hasSecAcc) {
            this.sortAccPriority(response.secondaryaccession);
            response.secondaryaccessionurl = this.getSecAccUrls(response.secondaryaccession);
        }
        response.hasSecAcc = hasSecAcc;

        return response;
    },

    //Sorts list of secondary accession codes by priority.
    //NOTE: smaller index equates to higher priority
    sortAccPriority: function (secAccs) {
        secAccs.forEach((secAcc, index) => {   
            let priorIndex; 

            if (index) {
                priorIndex = this.secAccMap[secAccs[index - 1].slice(0,3)];
                if (priorIndex > this.secAccMap[secAcc.slice(0,3)]) {
                    secAccs[index] = secAccs[index - 1];
                    secAccs[index - 1] = secAcc;
                }
            }
        });
    },

    //Works out the secondary accession URL
    getSecAccUrls: function (secAccs) {
        const urls = [];

        secAccs.forEach((secAcc) => {
            const code = secAcc.slice(0,3);
            urls.push(this.secAccUrls[this.secAccMap[code]] + secAcc);
        });
        return urls;
    }
});