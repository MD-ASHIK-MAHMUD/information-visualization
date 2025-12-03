import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const margin = { top: 20, right: 30, bottom: 40, left: 40 };
// const width = 800 - margin.left - margin.right;
// const height = 500 - margin.top - margin.bottom;
const width = 1000 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;
console.log(height)
const svg = d3.select("#chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

let globalData; // ⭐ store data globally so buttons can use it

// Load CSV
d3.csv("CO2.csv").then(function (data) {

    data.forEach(d => {

        d.CO2_Emission = +d["CO2 emission (Tons)"];
        d.Population = +d["Population(2022)"];
        console.log(d.CO2_Emission)
        d.Year = +d.Year;
    });

    globalData = data; // ⭐ assign to global variable

    console.log("CSV loaded:", globalData);

    // createBarChart(globalData);  // show a default chart
});

// Buttons
// document.getElementById('barChartBtn').addEventListener('click', () => toggleChart("bar"));
document.getElementById('lineChartBtn').addEventListener('click', () => toggleChart("line"));

// Clear SVG before drawing a new chart
function clearSVG() {
    svg.selectAll("*").remove();
}

function toggleChart(type) {
    if (!globalData) return; // data not loaded yet

    clearSVG();

    if (type === "line") createLineChart(globalData);

}

// Line Chart Visualization
function createLineChart(data) {
    // 1. Group data by Country
    const dataByCountry = d3.group(data, d => d.Country);

    // 2. Calculate total CO2 for each country to find the top 5
    const countryTotals = Array.from(dataByCountry, ([country, values]) => {
        const totalCO2 = d3.sum(values, d => d.CO2_Emission);
        return { country, totalCO2 };
    });

    // 3. Sort by total CO2 descending and take top 5
    const topCountries = countryTotals
        .sort((a, b) => b.totalCO2 - a.totalCO2)
        .slice(0, 10)
        .map(d => d.country);

    // Filter data to include only top 5 countries
    const filteredData = data.filter(d => topCountries.includes(d.Country));

    // 4. Scales
    const x = d3.scaleLinear()
        .domain(d3.extent(filteredData, d => d.Year))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.CO2_Emission)])
        .nice()
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(topCountries)
        .range(d3.schemeCategory10);

    // 5. Line generator
    const line = d3.line()
        .x(d => x(d.Year))
        .y(d => y(d.CO2_Emission));

    // 6. Draw lines
    // Group filtered data by country again for drawing
    const groupedFilteredData = d3.group(filteredData, d => d.Country);

    svg.selectAll(".line")
        .data(groupedFilteredData)
        .join("path")
        .attr("class", "line")
        .attr("d", ([country, values]) => line(values))
        .attr("fill", "none")
        .attr("stroke", ([country]) => color(country))
        .attr("stroke-width", 2);

    // 7. Axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d"))); // Format year as integer

    svg.append("g")
        .call(d3.axisLeft(y).tickFormat(d => (d / 1e9) + "B"));

    // 8. Legend
    const legend = svg.selectAll(".legend")
        .data(topCountries)
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(${width - 150}, ${i * 20})`);

    legend.append("rect")
        .attr("x", 0)
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", d => color(d));

    legend.append("text")
        .attr("x", 20)
        .attr("y", 6)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .style("fill", "black") // Assuming light background
        .text(d => d);
}
