/**
 * @license
 * Copyright © 2017-2018 OSIsoft, LLC. All rights reserved.
 * Use of this source code is governed by the terms in the accompanying LICENSE file.
 */
import { Component, Input, OnChanges, Inject, OnDestroy, OnInit} from '@angular/core';
import { PiWebApiService} from '@osisoft/piwebapi';
import { EventFrameItems} from '@osisoft/piwebapi'; // Import the Type definitions
import { PIWEBAPI_TOKEN} from 'api/tokens';
import { IDGeneratorService } from '../id-generator.service';
import { AmChartsService, AmChart } from '@amcharts/amcharts3-angular';
import 'amcharts3/amcharts/amcharts';
import 'amcharts3/amcharts/serial';
import 'amcharts3/amcharts/themes/light';
import 'amcharts3/amcharts/gantt';

interface ChartItem {
  start: Date;
  end: Date;
  color: string;
  task: string;
  bullet: string;
}

interface ChartCategory {
  category: string;
  items: ChartItem[];
}

@Component({
  selector: 'GanttChartComponent',
  templateUrl: 'CGI.PICOE.Gantt.component.html',
  styleUrls: ['CGI.PICOE.Gantt.component.css']
})

export class GanttChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() fgColor: string;
  @Input() bkColor: string;
  @Input() cat1Color: string;
  @Input() cat2Color: string;
  @Input() cat3Color: string;
  @Input() cat4Color: string;
  @Input() webID: string;
  @Input() categoryFilter: string;
  @Input() display_StartTime: string;
  @Input() display_EndTime: string;
  @Input() data: any;
  @Input() pathPrefix: string;
  values: any[];
  private chart: AmChart;
  efData: EventFrameItems;
  dataLoaded: boolean;
  id: string;
  chartData: ChartCategory[];
  chartStartTime: string;
  chartEndTime: string;

  constructor(
    @Inject(PIWEBAPI_TOKEN) private piWebApiService: PiWebApiService,
    public AmCharts: AmChartsService,
    private idGenerator: IDGeneratorService) {
      // only bare minimum code here
      this.dataLoaded = false;
      this.id = idGenerator.generateID('CGI.PICOE.Gantt');
  }

  ngOnInit(): void {
    // Get EventFrames only once
    // Call PI Web API: this is angular observable
    // let getEventFrames$ = this.piWebApiService.element.getEventFrames$(elemWebID, {startTime: '*-7d'});
    let getEventFrames$ = this.piWebApiService.element.getEventFrames$(
      this.webID,
       {startTime: this.display_StartTime,
         endTime: this.display_EndTime
        }
      );
    // subscribe to the responses
    getEventFrames$.subscribe(data => {
      this.efData = data;
      this.parseResults();
    });
  }

  ngAfterViewInit() {
    this.loadChart();
  }

  loadChart(): void {
    // this.chartData = [];

    this.chart = this.AmCharts.makeChart( this.id, {
      'type': 'gantt',
      'theme': 'light',
      'marginRight': 0,
      'marginLeft': 0,
      'marginTop': 0,
      'marginBottom': 0,
      // 'period': 'ss', // ss already default
      'balloonDateFormat': 'JJ:NN', // does not work!
      'columnWidth': 0.8,
      'brightnessStep': 25,
      'pathToImages': this.pathPrefix + '/assets/images/amchart/',
      'autoTransform': true, // support zooming of parent div
      'zoomOutText': '', // hide zoom buttom
      'chartScrollbar': {
        'enabled': false
      },
      'valueScrollbar': {
        'enabled': false
      },
      'valueAxis': {
        'type': 'date'
      },
      'graph': {
        'fillAlphas': 0.8,
        'lineAlpha': 1,
        'lineColor': '#fff',
        'balloonText': '<b>[[task]]</b>:<br />[[start]] -> [[end]]',
        'bulletField': 'bullet'
      },
      'rotate': true,
      'categoryField': 'category',
      'segmentsField': 'items',
      'colorField': 'color',
      'startDateField': 'start',
      'endDateField': 'end',
      'dataProvider': this.chartData,
      'chartCursor': {
        'cursorColor': '#1f77b4',
        'valueBalloonsEnabled': false,
        'cursorAlpha': 0,
        'valueLineAlpha': 0.5,
        'valueLineBalloonEnabled': true,
        'valueLineEnabled': true,
        'zoomable': false,
        'valueZoomable': false
      }
    } );
  }

  ngOnChanges(changes) {
    if (changes.data) {
      // update the current absolute chart start and end times
      this.chartStartTime = changes.data.currentValue.startTime;
      this.chartEndTime = changes.data.currentValue.endTime;
    }
    // This is webAPI only, so no use of data, just redraw
    this.updateChart();
  }

  updateChart(): void {
    if (this.chart) {
      this.AmCharts.updateChart(this.chart, () => {
        // Change whatever properties you want
        this.chart.dataProvider = this.chartData;
        this.chart.valueAxes[0].minimumDate = this.chartStartTime; // this.formatDateTime('2016-01-02T06:00:00Z');
        this.chart.valueAxes[0].maximumDate = this.chartEndTime; // this.formatDateTime('2016-01-02T18:00:00Z');
      });
    }
  }

  ngOnDestroy() {
    if (this.chart) { // cleanup chart
      this.AmCharts.destroyChart(this.chart);
    }
    // kill PI Web API observable
    // TODO
  }

  parseResults() {
    // process results from PI Web API data
    if (this.efData !== undefined) {this.dataLoaded = true} else {this.dataLoaded = false}

    if (this.efData !== undefined) {
      // Create a hierarchy based on the individual items
      this.chartData = []; // clear array
      //  first create the categories
      this.efData.Items.forEach(element => {
        let bulletShape = 'none';
        // First create item with data
        if (element.IsAcknowledged) {
          bulletShape = 'diamond';
        } else {
          bulletShape = 'none';
        }
        let newItem: ChartItem = {
          task: element.Name,
          start: new Date(element.StartTime),
          end: new Date(element.EndTime),
          color: undefined,
          bullet: bulletShape
        }
        // check if category already exists (only single category supported!!!)
        let existingCategory = this.chartData.find(item => item.category === element.CategoryNames[0]);
        // if (catIndex === -1) {
        if (typeof existingCategory === 'undefined') {
          // Not found, create category first
          let newItems = [];
          newItems.push(newItem);
          let newCategory: ChartCategory = {
            category: element.CategoryNames[0],
            items: newItems
          };
          this.chartData.push(newCategory); // add to chartData
        } else {
          // add to existing category
          existingCategory.items.push(newItem);
        }
      });
    }
  }

}
