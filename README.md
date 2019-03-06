ArrayExpress Search
===================

<img src="https://www.ebi.ac.uk/arrayexpress/assets/images/ae-logo-64.svg" align="left" hspace="10" vspace="1">

Responsive single-page search app for EMBL's ArrayExpress archive of functional genomics data. Implemented using Marionette 3.2, it relies on JavaScript ES6, Webpack and LESS for a modular codebase. It also harnesses Local Storage to optimise the returning user's experience.

<p align="center">
	<img src="http://hqcasanova.github.io/arrayexpress-search/arrayexpress.jpg" alt="Responsive ArrayExpress tool">
</p>

# Roadmap
- Decoupling: instead of relying on a bifurcated template for the experiment view, employ separate views for the search result card and the single experiment details. Inherit from the existing experiment view when creating the new details view.
- Feature: finish off bibliography rendering, with conditionals for volume, pages, etc...
- Feature: implement MINSEQE section. Find out if there's enough data in the responses from the /experiments and /files endpoints to go by. 
- Feature: implement the files section with links to investigation description, sample and data relationship, etc...
- Feature: implement filtering by data fields. Use fullscreen modal accessible through additional button on right-hand side corner of the header. 
- Feature: make the filtering modal's contents dynamic depending on window's width, rendering select boxes directly inside the header if they fit in. 
- UX: when search result set is sizeable, there is a rendering delay between the single experiment details view and the result list. Use feedback different from the spinner to convey system as opposed to data exchange progress. Eg: bar along header's bottom border.
- UX: back to top button.
- UX: find a way to show the "Genome Space" button outside the details view, in the result card for each experiment.
- UX: show the suggestions view when no query present or blank.
- Improve support for mobile stock browsers. Android's one is not respecting the top margin for the contents main section, leading to the overlapping of the first experiment's section and the header. Chrome on Android is fine.
- Add JSDoc documentation.
- Add unit tests.
