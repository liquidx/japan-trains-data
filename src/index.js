import _ from 'lodash';
import './index.scss';

import train_lines from '../train_lines';
import train_line_svg from '../train_line_svg';

let corrections = null;
let geojson_lines = null;
let all_lines = null;

let activateArrows = () => {
  document.addEventListener('keyup', e => {
    if (e.key == 'ArrowRight' || e.key == 'ArrowLeft') {
      e.preventDefault()
      let selected = document.querySelector('.line.selected')
      if (selected) {
        let nextSelected = null
        if (e.key == 'ArrowRight') {
          nextSelected = selected.nextSibling
        } else if (e.key == 'ArrowLeft') {
          nextSelected = selected.previousSibling
        }
        let nextCompany = nextSelected.getAttribute('data-company')
        let nextLine = nextSelected.getAttribute('data-line')
        console.log(nextCompany, nextLine)
        load_train_line_svg(nextCompany, nextLine)

        _.map(document.querySelectorAll('.line'), o => o.classList.remove('selected'))
        nextSelected.classList.add('selected')
      }
    }
    return true
  })
}

let load_train_line_svg = (company_name, line_name, filter_line = null) => {
  let correction = corrections[company_name] && corrections[company_name][line_name];
  let svg = train_line_svg(geojson_lines, company_name, line_name, 640, correction);
  let viewer = document.querySelector('#svg-viewer');
  viewer.innerHTML = svg;


  for (var p of document.querySelectorAll('g.segment')) {
    p.addEventListener('mouseover', (e) => {
      e.target.setAttribute('stroke-width', '4');
      e.target.setAttribute('stroke', 'red');

    });
    p.addEventListener('mouseout', (e) => {
      e.target.removeAttribute('stroke-width');
      e.target.removeAttribute('stroke');
    });
  }
};

let create_controls = () => {
  let companies = Object.keys(all_lines);

  // force a few companies to tbe at the top.
  let manual_order_companies = [
    '東京地下鉄',
    '東京急行電鉄',
    '東京モノレール',
    '東京都',
    '東京臨海高速鉄道',
    '東日本旅客鉄道',
    '西武鉄道',
    '京成電鉄',
    '京王電鉄'
  ]

  companies = _.pull(companies, manual_order_companies)
  companies = _.concat(manual_order_companies, companies)


  var controls = document.querySelector('#controls');
  for (var company of companies) {
    var d = document.createElement('a');
    d.classList.add('train-company', 'line')
    d.setAttribute('href', `#${company}`);
    d.setAttribute('data-company', company);
    d.appendChild(document.createTextNode(company));
    d.addEventListener('click', function (e) {
      let element = e.target;
      let company_name = element.getAttribute('data-company');

      // Open adjacent Container
      //    "this" is passed by using function
      const linesContainer = this.nextElementSibling
      const linesContainerChildren = linesContainer.children.length
      const maxHeight = `${100 * linesContainerChildren}px` //The Max Height the menu will animate out to
      if (linesContainer.style.maxHeight === maxHeight) {
        linesContainer.style.maxHeight = "0px";
      } else {
        linesContainer.style.maxHeight = maxHeight;
      }

      load_train_line_svg(company_name, null);

      _.map(document.querySelectorAll('.line'), o => o.classList.remove('selected'))
      element.classList.add('selected')

      return true;
    });
    controls.appendChild(d);
    var lines = Object.keys(all_lines[company]);

    //Lines Wrapping Div
    const lineDiv = document.createElement('div');
    lineDiv.classList.add('train-line-container')
    controls.appendChild(lineDiv)

    for (var line of lines) {
      var l = document.createElement('a');
      l.classList.add('train-line', 'line')
      l.setAttribute('href', `#${company}/${line}`);
      l.setAttribute('data-line', line);
      l.setAttribute('data-company', company);
      l.appendChild(document.createTextNode(line));
      l.addEventListener('click', (e) => {
        let element = e.target;
        let line_name = element.getAttribute('data-line');
        let company_name = element.getAttribute('data-company');
        load_train_line_svg(company_name, line_name);

        _.map(document.querySelectorAll('.line'), o => o.classList.remove('selected'))
        element.classList.add('selected')
        return true;
      });
      lineDiv.appendChild(l);
    }
  }
};

let main = () => {
  fetch('/config/train_line_corrects.json').then(r => r.json())
    .then((json) => {
      corrections = json;
      fetch('/data/N02-18_GML/N02-18_RailroadSection.geojson')
        .then((response) => {
          return response.json();
        })
        .then((json) => {
          geojson_lines = json;
          all_lines = train_lines(json);
          create_controls();
          let company = '東日本旅客鉄道';
          let line = '山手線';
          if (document.location.hash) {
            let path = document.location.hash.replace('#', '').split('/');
            if (path.length == 1) {
              company = decodeURIComponent(path[0]);
              line = null;
            }
            if (path.length == 2) {
              company = decodeURIComponent(path[0]);
              line = decodeURIComponent(path[1]);
            }
          }
          console.log(company, line);
          load_train_line_svg(company, line);
        });
    });

  activateArrows()
};

main();
