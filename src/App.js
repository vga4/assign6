import React, { Component } from 'react';
import './App.css';
import * as d3 from 'd3';
import FileUpload from './FileUpload';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
    };
    this.set_data = this.set_data.bind(this);
    
  }
    set_data = (data) => {
      this.setState({ data });
    }
  componentDidMount() {
  }

  componentDidUpdate() {
    if (this.state.data) {
      this.renderStreamGraph();
    }
  }

  renderStreamGraph() {
    const data = this.state.data
    const colors = ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00"] //colors for the graph 
    const keys = ["GPT-4", "Gemini", "PaLM-2", "Claude", "LLaMA-3.1"] //keys for the graph, these should match the 
    const stack = d3.stack().keys(keys).offset(d3.stackOffsetSilhouette); //stack the data
    const stackedData = stack(data);

    //get the colors for the graph
    const color = d3.scaleOrdinal().domain(keys).range(colors);

    const svg = d3.select(this.svgRef);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 100, bottom: 50, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 700 - margin.top - margin.bottom;

    const x = d3.scaleTime()
      .domain(d3.extent(data, d => new Date(d.Date)))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([d3.min(stackedData, layer => d3.min(layer, d => d[0])), d3.max(stackedData, layer => d3.max(layer, d => d[1]))])
      .range([height, 0]);

    const areaGen = d3.area().x(d => x(new Date(d.data.Date)))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveCardinal);

    const tooltip = d3.select('.tooltip');

    const graphGroup = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    graphGroup.selectAll('path')
      .data(stackedData)
      .join('path')
      .attr('d', areaGen)
      .attr('fill', ({ key }) => color(key))
      .on('mouseover', (event, d) => {
        tooltip.style('display', 'block')
          .html('')  
          .style('left', `${event.pageX + 10}px`) 
          .style('top', `${event.pageY + 10}px`); 
        const miniChart = this.createBarChart(d, color(d.key));
        tooltip.node().appendChild(miniChart); 
      })
      .on('mousemove', event => {
        tooltip.style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY + 10}px`);
      })
      .on('mouseout', () => {
        tooltip.style('display', 'none');
      });

    //graphGroup.append('g').call(d3.axisLeft(y)); {/*add this back in to show y -axis */}

    graphGroup.append('g')
      .attr('transform', `translate(0,${height+15})`) //added 15 to height so the stream graph wouldn't overlap with the x-axis
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%b'))); //added tickFormat so that the months would properly show

    const legend = graphGroup.append('g')
      .attr('transform', `translate(${650}, 20)`); //determines the position of the legend

    const reversedLegend = keys.reverse()
  
      reversedLegend.forEach((reversedLegend, i) => {
      legend.append('rect')
        .attr('x', 20)
        .attr('y', i * 20)
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', color(reversedLegend));
  
      legend.append('text')
        .attr('x', 40) 
        .attr('y', i * 20 + 12)  
        .text(reversedLegend)
        .style('font-size', '12px')  
        
    });
  }

  createBarChart(d, color) { //get data and color from the createStreamGraph
    const data = d; 
    const width = 300;
    const height = 150;
  
    const margin = { top: 0, right: 20, bottom: 20, left: 40 };
  
    const x = d3.scaleBand()
      .domain(data.map(d => new Date(d.data.Date))) //new Date so each bar is shown in mini chart
      .range([0, width - margin.left - margin.right])
      .padding(0.2);
  
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d[1] - d[0])]).range([height - margin.top - margin.bottom, 0]); 
  
    const svg = d3.create('svg').attr('width', width).attr('height', height);
  
    const chartGroup = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  
    chartGroup.selectAll('rect').data(data).join('rect')
      .attr('x', d => x(new Date(d.data.Date)))  
      .attr('y', d => y(d[1] - d[0]))  
      .attr('width', x.bandwidth())  
      .attr('height', d => y(0) - y(d[1] - d[0]))  
      .attr('fill', color);  
  
    chartGroup.append('g')
      .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)  
      .call(d3.axisBottom(x).ticks(3).tickFormat(d3.timeFormat('%b')))  
  
    chartGroup.append('g')
      .call(d3.axisLeft(y).ticks(3))
      .style('font-size', '10px');
  
    return svg.node(); 
  }

  render() {
    return (
      <div>
        <FileUpload set_data={this.set_data}></FileUpload> {/*header for file upload*/}
        <svg ref={ref => this.svgRef = ref} width="1000" height="750"></svg>
        <div className="tooltip" ></div>
      </div>
    );
  }
}

export default App;