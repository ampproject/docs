// Copyright 2020 The AMPHTML Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import i18n from '../I18n.js';

const CATEGORIES = {
  fast: 'Good',
  average: 'Needs Improvement',
  slow: 'Poor',
};

class Scale {
  constructor(container) {
    this.container = container;
    this.indicator = container.querySelector('.ap-a-pixi-scale-bar-indicator');
    this.label = this.indicator.querySelector('span');
  }

  render(data) {
    const percentile = Math.round(data.score * 100);

    this.indicator.style.width = `${percentile}%`;
    this.label.textContent = `${percentile}% passed`;
    if (percentile < 20) {
      this.indicator.classList.add('inversed');
    }
  }
}

class CoreWebVitalView {
  constructor(container) {
    this.container = container;
    this.type = container.id.split('.')[0];
    this.metric = container.id.split('.')[1];

    this.scale = new Scale(container);

    this.category = this.container.querySelector(
      '.ap-m-pixi-primary-metric-category'
    );
    this.average = this.container.querySelector(
      '.ap-m-pixi-primary-metric-average'
    );
    this.improvement = this.container.querySelector(
      '.ap-m-pixi-primary-metric-improvement'
    );
    this.recommendations = this.container.querySelector(
      '.ap-m-pixi-primary-metric-recommendations'
    );
  }

  render(report) {
    const {data, unit} = report;

    this.scale.render(data);

    const responseCategory = data.category.toLowerCase();
    const displayCategory = CATEGORIES[responseCategory];
    this.container.classList.add(responseCategory);
    this.category.textContent = displayCategory;

    const average = (data.numericValue / unit.conversion).toFixed(2);
    this.average.textContent = `${average} ${unit.name}`;
    this.improvement.textContent = 'Not yet implemented';
    this.recommendations.textContent = 'Not yet implemented';

    this.toggleLoading(false);
  }

  reset() {
    this.container.classList.remove(...Object.values(CATEGORIES));
    this.category.textContent = i18n.translate('Analyzing');
    this.average.textContent = i18n.translate('Analyzing');
    this.improvement.textContent = i18n.translate('Calculating');
    this.recommendations.textContent = i18n.translate('Analyzing');

    this.toggleLoading(true);
  }

  toggleLoading(force) {
    this.container.classList.toggle('loading', force);
  }
}

export default class CoreWebVitalsReportView {
  constructor(doc, id) {
    this.container = document.getElementById(id);
    this.pristine = true;

    this.coreWebVitalViews = {};
    // Initialize views before running the check to be able
    // to toggle the loading state
    for (const coreWebVitalsContainer of document.querySelectorAll(
      '.ap-m-pixi-primary-metric'
    )) {
      this.coreWebVitalViews[coreWebVitalsContainer.id] =
        this.coreWebVitalViews[coreWebVitalsContainer.id] ||
        new CoreWebVitalView(coreWebVitalsContainer);

      this.coreWebVitalViews[coreWebVitalsContainer.id].toggleLoading(true);
    }

    this.tabs = document.querySelectorAll('.ap-o-pixi-primary-checks-tabs-tab');
    this.tabContents = document.querySelectorAll(
      '.ap-o-pixi-primary-checks-data'
    );
    for (let i = 0; i < this.tabContents.length; i++) {
      this.tabs[i].addEventListener('click', () => {
        this.onClickTab(i);
      });
    }
  }

  onClickTab(index) {
    for (let i = 0; i < this.tabs.length; i++) {
      this.tabs[i].classList.toggle('active', i == index);
      this.tabContents[i].classList.toggle('active', i == index);
    }
  }

  render(report = {}) {
    this.pristine = false;
    const results = report.data.pageExperience;

    for (const coreWebVitalView of Object.values(this.coreWebVitalViews)) {
      const type = results[coreWebVitalView.type];
      if (type) {
        const metric = type[coreWebVitalView.metric];
        if (metric) {
          coreWebVitalView.render(metric);
          continue;
        }
      }

      coreWebVitalView.render();
    }

    this.toggleLoading(false);
  }

  reset() {
    if (this.pristine) {
      return;
    }

    for (const coreWebVitalView of Object.values(this.coreWebVitalViews)) {
      coreWebVitalView.reset();
    }
  }

  toggleLoading(force) {
    for (const coreWebVitalView of Object.values(this.coreWebVitalViews)) {
      coreWebVitalView.toggleLoading(force);
    }
  }
}
