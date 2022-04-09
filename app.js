
var statedata;
var statedatafiltered;
var countydata;
var timedata;
const racecodes = {'0': 'All Races', '1': 'White', '2': 'Black', '3': 'Hispanic'};
const sexcodes = {'0': 'Both', '1': 'Male', '2': 'Female'};
const iprcodes = {'0': 'All Incomes', '1': 'At or Below 200% of Poverty', '2': 'At or Below 250% of Poverty', '3': 'At or Below 138% of Poverty', '4': 'At or Below 400% of Poverty', '5': 'Between 138% - 400% of Poverty'};
const tableselection = {'race': 'Any', 'sex': 'Any', 'ipr': 'Any'}

const years = document.querySelector('#year');
const states = document.querySelector('#state');
const loading = document.querySelector('#loadcontainer');
//get state names and codes
fetch('https://api.census.gov/data/timeseries/healthins/sahie?get=NAME&for=state:*&time=2019')
    .then(response => response.json())
    .then(data => {
        d3.select("#state")
                .selectAll("option")
                .data(data.slice(1))
                .join("option")
                    .attr('value',d => d[2])
                    .text(d => d[0]);
        loading.style.display = 'none';
    });

//set year options
d3.select('#year')
    .selectAll('option')
    .data(d3.range(2006,2020))
    .join('option')
        .attr('value',d => d)
        .text(d => d);

const displaytabledata = (data) => {
    d3.select("#tb")
        .selectAll("tr")
        .data(data)
        .join("tr")
        .selectAll("td")
        .data(d => d)
        .join("td")
            .text(d => d);
}

//submit get state data


d3.select('#submit')
    .on('click', () => {
    loading.style.display = 'flex';
    fetch(`https://api.census.gov/data/timeseries/healthins/sahie?get=RACECAT,SEXCAT,IPRCAT,PCTUI_PT&for=state:${states.value}&time=${years.value}`)
        .then(res => res.json())
        .then(data => {
            trimmed = [];
            data.forEach(row => {
                //replace code num with description
                for (let code of d3.range(0,6)) {
                    if (row[0] === String(code)) {
                        row[0] = row[0].replace(code,racecodes[String(code)]);
                    }
                    if (row[1] === String(code)) {
                        row[1] = row[1].replace(code,sexcodes[String(code)]);
                    }
                    if (row[2] === String(code)) {
                        row[2] = row[2].replace(code,iprcodes[String(code)]);
                    }
                }
                trimmed.push(row.slice(0,4));
            });
            
            statedata = trimmed.slice(1);
            displaytabledata(statedata);
            timetab.classed('w3-indigo', false).classed('w3-blue', true);
            countytab.classed('w3-indigo', false).classed('w3-blue', true);
            demotab.classed('w3-indigo', true);
            updatedemograph(statedata);
            loading.style.display = 'none';
    });
    fetch(`https://api.census.gov/data/timeseries/healthins/sahie?get=PCTUI_PT,NAME&for=county:*&in=state:${states.value}&time=${years.value}`)
        .then(res => res.json())
        .then(data => {
            trimmed = [];
            data.forEach(row => {
                trimmed.push(row.slice(0,2));
            });
            countydata = trimmed.slice(1);
        });
    fetch(`https://api.census.gov/data/timeseries/healthins/sahie?get=PCTUI_PT,YEAR&for=state:${states.value}`)
        .then(res => res.json())
        .then(data => {
            trimmed = []
            data.forEach(row => {
                trimmed.push(row.slice(0,2));
            });
            timedata = trimmed.slice(1);
        })
}
    )
const updatedemograph = (statedata) => {
    d3.select('#graph')
        .text('')
    
    sdata = [];
    statedata.forEach(row => {
        if (row.includes('Both')) {
            sdata.push(row);
        }
    })
    // set the dimensions and margins of the graph
    const margin = {top: 30, right: 30, bottom: 70, left: 60},
        width = (window.innerWidth*.75) - margin.left - margin.right,
        height = (window.innerHeight*.75) - margin.top - margin.bottom;

    // append the svg object to the body of the page
    const svg = d3.select("#graph")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    const groups = [];
    for (let group of new Set(d3.map(sdata, d => d[2]))) {
        groups.push(group);
    }
    const subgroups = [];
    for (let subgroup of new Set(d3.map(sdata, d => d[0]))) {
        subgroups.push(subgroup);
    }
    
    // Add X axis
    const x = d3.scaleBand()
        .domain(groups)
        .range([0, width])
        .padding([0.2])
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickSize(0));

    // Add Y axis
    const y = d3.scaleLinear()
        .domain([0, Math.ceil((d3.max(sdata.map(d => Number(d[3]))) + 1)/5)*5])
        .range([ height, 0 ]);
    svg.append("g")
        .call(d3.axisLeft(y));

    const xSubgroup = d3.scaleBand()
        .domain(subgroups)
        .range([0, x.bandwidth()])
        .padding([0.05]);

    const tooltip = d3.select("#graph")
        .append("div")
        .style("opacity", 1)
        .style('display', 'none')
        .style('position', 'fixed')
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "10px");
        
      // Three functions that change the tooltip when user hover / move / leave a cell
    const mouseover = function(event, d) {
        const subgroupName = d3.select(this.parentNode).datum()[0];
        const subgroupValue = d3.select(this.parentNode).datum()[3];
        tooltip
            .html(`Race: ${subgroupName}<br>Percent Uninsured: ${subgroupValue}`)
            .style("display", 'block')
            .style("left",`${event.x + 20}px`)
            .style("top",`${event.y - 50}px`)
    }
    const mousemove = (event, d) => {
        tooltip
            .style("left", `${event.x + 20}px`)
            .style("top", `${event.y - 50}px`);
    }
    const mouseleave = (d) => {
        tooltip
            .style('display', 'none');
    }    
    // color palette = one color per subgroup
    const color = d3.scaleOrdinal()
        .domain(subgroups)
        .range(['#e41a1c','#377eb8','#4daf4a','#a366ff']);
    // Show the bars
    svg.append("g")
        .selectAll("g")
    // Enter in data = loop group per group
        .data(sdata)
        .enter()
        .append("g")
            .attr("transform", d => `translate(${x(d[2])},0)`)
        .selectAll("rect")
        .data(d => subgroups.map(() => ({ key: d[0], value: d[3] })))
        .enter().append("rect")
            .attr("x", d => xSubgroup(d.key))
            .attr("y", d => y(d.value))
            .attr("width", xSubgroup.bandwidth())
            .attr("height", d => height - y(d.value))
            .attr("fill", d => color(d.key))
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseleave', mouseleave);
}

//Change tab colors
const demotab = d3.select('#demo');
demotab.on('click', () => {
    if (statedata) {
        demotab.classed('w3-indigo', true);
        timetab.classed('w3-blue', true).classed('w3-indigo', false);
        countytab.classed('w3-blue', true).classed('w3-indigo', false);
        updatedemograph(statedata);
    }
});


//County Graph
const updatecountygraph = (countydata) => {
    d3.select('#graph')
        .text('')
    // set the dimensions and margins of the graph
    const margin = {top: 50, right: 50, bottom: 100, left: 60},
        width = (window.innerWidth*.9) - margin.left - margin.right,
        height = (window.innerHeight*.75) - margin.top - margin.bottom;

    // append the svg object
    const svg = d3.select("#graph")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
 

// X axis
    const x = d3.scaleBand()
        .range([ 0, width ])
        .domain(countydata.map(d => d[1]))
        .padding(0.5);
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end")


// Add Y axis
    const y = d3.scaleLinear()
        .domain([0, Math.ceil((d3.max(countydata.map(d => Number(d[0]))) + 1)/5)*5])
        .range([ height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));


    const tooltip = d3.select("#graph")
        .append("div")
        .style("opacity", 1)
        .style('position', 'fixed')
        .style('display', 'none')
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "10px");
        
      // Three functions that change the tooltip when user hover / move / leave a cell
    const mouseover = (event, d) => {
        tooltip
            .html(`County: ${d[1]}<br>Percent Uninsured: ${d[0]}`)
            .style('display', 'block')
            .style("left", `${event.x + 20}px`)
            .style("top", `${event.y - 50}px`);
    }

    const mousemove = (event, d) => {
        tooltip
            .style("left", `${event.x + 20}px`)
            .style("top", `${event.y - 50}px`);
    }
    const mouseleave = (d) => {
        tooltip
            .style('display', 'none');
    } 

// Bars
    svg.selectAll("mybar")
        .data(countydata)
        .enter()
        .append("rect")
        .attr("x", d => x(d[1]))
        .attr("y", d => y(Number(d[0])))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(Number(d[0])))
        .attr("fill", "#69b3a2")
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseleave', mouseleave);

}
//Change tab colors
const countytab = d3.select('#county');
countytab.on('click', () => {
    if (countydata) {
        countytab.classed('w3-indigo', true);
        timetab.classed('w3-blue', true).classed('w3-indigo', false);
        demotab.classed('w3-blue', true).classed('w3-indigo', false);
        updatecountygraph(countydata);
    }
});

//Time Graph
const updatetimegraph = (timedata) => {
    //clear graph
    d3.select('#graph')
        .text('')
    // set the dimensions and margins of the graph
    const margin = {top: 10, right: 30, bottom: 30, left: 60},
        width = (window.innerWidth*.75) - margin.left - margin.right,
        height = (window.innerHeight*.75) - margin.top - margin.bottom;
    // append the svg object 
    const svg = d3.select("#graph")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",`translate(${margin.left},${margin.top})`);
    
    //parse time
    timeparsed = [];
    timedata.forEach(row => timeparsed.push([row[0],d3.timeParse('%Y')(row[1])]));

    const tooltip = d3.select("#graph")
        .append("div")
        .style("opacity", 1)
        .style('position', 'fixed')
        .style('display', 'none')
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "10px");
    
  // Three function that change the tooltip when user hover / move / leave a cell
    const mouseover = (event, d) => {
        tooltip
            .html(`Year: ${String(d[1]).split(' ')[3]}<br>Percent Uninsured: ${d[0]}`)
            .style('display', 'block')
            .style("left", `${event.x + 20}px`)
            .style("top", `${event.y - 50}px`);
    }

    const mousemove = (event, d) => {
        tooltip
            .style("left", `${event.x + 20}px`)
            .style("top", `${event.y - 50}px`);
    }
    const mouseleave = (d) => {
        tooltip
            .style('display', 'none');
    }
    
    // Add X axis --> it is a date format
    const x = d3.scaleTime()
      .domain(d3.extent(timeparsed, d => d[1]))
      .range([ 0, width ]);
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    // Add Y axis
    const y = d3.scaleLinear()
      .domain([0, Math.ceil((d3.max(timedata.map(d => Number(d[0]))) + 1)/5)*5])
      .range([ height, 0 ]);
    svg.append("g")
      .call(d3.axisLeft(y));

    // Add the line
    svg.append("path")
      .datum(timeparsed)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", d3.line()
        .x(d => x(d[1]))
        .y(d => y(d[0])));

    // Circles
    svg.selectAll("mycircle")
        .data(timeparsed)
        .enter()
        .append("circle")
            .attr("cx", d => x(d[1]))
            .attr("cy", d => y(d[0]))
            .attr("r", "5")
            .style("fill", "#0099ff")
            .attr("stroke", "black")
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseleave', mouseleave);

}
//Change tab colors
const timetab = d3.select('#time');
timetab.on('click', () => {
    if (timedata) {
        timetab.classed('w3-indigo', true);
        countytab.classed('w3-blue', true).classed('w3-indigo', false);
        demotab.classed('w3-blue', true).classed('w3-indigo', false);
        updatetimegraph(timedata);
    }
});

//Table Sorting
d3.select('.arrow-up')
    .on('click', () => {
        d3.select('#tb')
            .selectAll('tr')
            .sort((a,b) => d3.ascending(Number(a[3]),Number(b[3])))
});
d3.select('.arrow-down')
    .on('click', () => {
        d3.select('#tb')
            .selectAll('tr')
            .sort((a,b) => d3.descending(Number(a[3]),Number(b[3])))
});


//Table filtering
const filtertable = (o, cat) => {
    datafiltered = [];
    tableselection[cat] = o;
    statedata.forEach(row => {
        if ((row.includes(tableselection['race']) || tableselection['race'] === 'Any') 
        && (row.includes(tableselection['sex']) || tableselection['sex'] === 'Any')
        && (row.includes(tableselection['ipr']) || tableselection['ipr'] === 'Any')) {
            datafiltered.push(row);
        }
    })
    statedatafiltered = datafiltered;
    displaytabledata(datafiltered);
}
//filter race
d3.select('#racefilter')
    .on('change', (e) => {
        filtertable(e.target.value, 'race');
    })
    .selectAll('option')
    .data(['Any'].concat(Object.values(racecodes)))
    .join('option')
        .attr('value',d => d)
        .text(d => d)
    
//filter sex
d3.select('#sexfilter')
    .on('change', (e) => {
        filtertable(e.target.value, 'sex');
    })
    .selectAll('option')
    .data(['Any'].concat(Object.values(sexcodes)))
    .join('option')
        .attr('value',d => d)
        .text(d => d)

//filter ipr
d3.select('#iprfilter')
    .on('change', (e) => {
            filtertable(e.target.value, 'ipr');
        })
    .selectAll('option')
    .data(['Any'].concat(Object.values(iprcodes)))
    .join('option')
        .attr('value',d => d)
        .text(d => d);


