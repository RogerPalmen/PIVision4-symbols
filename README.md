# PIVision4-symbols
2018 Hackathon submission

We make use of the amCharts library (the Javascript one, not the Angular one) to take the strain of proper rendering.

Of course, strapped for time as we had lots of project work, team members needing to spend time elsewhere, etc., so there are some items not done yet:

Open ends:

there is no service delivering the time of the display, and we did not change the Web API calls to make use of the timestamps provided by the OnChange handler. So timerange is fixed
ran out of time to do a search for Elements and Categories, so currently WebID is a configuration item, and no filtering on EF categories is done
a bug in  the amCharts datetime formatting of the dates in the balloon, so no formatting there
Unrealized ideas: plenty! Key item we wanted to include is writeback of Acknowledgements, Reasons, etc. Overlay of a trend, etc.
