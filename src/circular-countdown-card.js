import "@webcomponents/webcomponentsjs/webcomponents-bundle.js";
import * as d3 from "d3";
import { css, html, LitElement, svg } from "lit";
import { repeat } from "lit/directives/repeat.js";
import pkg from "../package.json";

class CircularCountdownCard extends LitElement {
	constructor() {
		super();

		// Defaults
		this._bins = undefined;
		this._binsConstant = false;
		this._padAngle = 1;
		this._cornerRadius = 4;
		this._defaultTimerFill = getComputedStyle(
			document.documentElement,
		).getPropertyValue("--primary-color");
		this._gradientColors = [this._defaultTimerFill, this._defaultTimerFill];
		this._defaultTimerEmptyFill = "#fdfdfd00";
		this._secondaryInfoSize;
		this._layout = "circle";
		this._reverse_color = false;
		this._icon = "";
		this._primaryInfo = "[days] nights till the EVENT!";
		this._secondaryInfo = "[proc]% days have passed";
		this._direction = "countdown";

		this._colorState = false;
		this._stateColor = getComputedStyle(
			document.documentElement,
		).getPropertyValue("--primary-text-color");

		// To update card every half second
		this._timeUpdater = 1;
		setInterval(() => {
			this._timeUpdater++;
		}, 500);

	}

	static get properties() {
		return {
			_config: {},
			_timeUpdater: {},
		};
	}

	setConfig(config) {
		if (!config.start_date || !config.start_date_is) {
			throw new Error("You need to provide start date (entity or constant date) and give which type it is!");
		}
		if(config.start_date_is === "entity"){
			var domainStart = config.start_date.split(".")[0];
			if (domainStart !== "input_datetime") {
				throw new Error("Provided start date entity is not an input_datetime!");
			}
		}else if(config.start_date_is === "date"){
			try {
				var testDate = new Date(config.start_date);
				if(testDate == "Invalid Date")
					throw new Error("Provided end date string is not a valid date ")
			}
			catch(e){
				throw new Error("Provided start date string is not a valid date ")
			}
		}else{
				throw new Error("Start_date_is can only be 'entity' or 'date'")
		}
		this._start_date_is = config.start_date_is;


		if (!config.end_date || !config.end_date_is) {
			throw new Error("You need to provide end date (entity or constant date) and give which type it is!");
		}
		if(config.end_date_is === "entity"){
			var domainEnd = config.end_date.split(".")[0];
			if (domainEnd !== "input_datetime") {
				throw new Error("Provided end date entity is not an input_datetime!");
			}
		}else if(config.end_date_is === "date"){
			try {
				var testDate = new Date(config.end_date);
				if(testDate == "Invalid Date")
					throw new Error("Provided end date string is not a valid date ")
			}
			catch(e){
				throw new Error("Provided end date string is not a valid date ")
			}
		}else{
				throw new Error("End_date_is can only be 'entity' or 'date'")
		}
		this._end_date_is = config.end_date_is;

		if (config.layout) {
			if (config.layout === "minimal") {
				this._layout = "minimal";
			}
		}
		
		if(config.bins_constant)
		{
			if (!config.bins) 
				throw new Error("You need to provide bins amount if bins are constant!");
			this._bins_constant = config.bins_constant
			this._bins = Math.min(200, config.bins);
			this._arcData = this._generateArcData();
			this._barData = this._generateBarData();
		}

		if (config.pad_angle) {
			this._padAngle = config.pad_angle;
		}

		if (config.corner_radius) {
			this._cornerRadius = config.corner_radius;
		}
		if(config.reverse_color){
			this._reverse_color = config.reverse_color
		}
		if (config.color) {
			if (config.color.length === 1) {
				this._gradientColors = [config.color[0], config.color[0]];
			} else {
				this._gradientColors = config.color;
			}
		}

		if (config.color_state) {
			this._colorState = config.color_state;
		}

		if (config.empty_bar_color) {
			this._defaultTimerEmptyFill = config.empty_bar_color;
		}

		if (config.secondary_info_size) {
			this._secondaryInfoSize = config.secondary_info_size;
		} else {
			if (config.layout === "minimal") {
				this._secondaryInfoSize = "80%";
			} else {
				this._secondaryInfoSize = "50%";
			}
		}

		if (config.icon) {
			this._icon = config.icon;
		}

		if (config.primary_info) {
			this._primaryInfo = config.primary_info;
		}

		if (config.secondary_info) {
			this._secondaryInfo = config.secondary_info;
		}

		if (config.direction) {
			this._direction = config.direction;
		}

		this._colorScale = d3.scaleSequential(
			d3.interpolateRgbBasis(this._gradientColors),
		);
		
		this._arc = d3
			.arc()
			.innerRadius(30)
			.outerRadius(48)
			.startAngle((d) => {
				return this._toRadians(d.start);
			})
			.endAngle((d) => {
				return this._toRadians(d.end);
			})
			.cornerRadius(this._cornerRadius)
			.padAngle(this._toRadians(this._padAngle));

		this._config = config;
	}

	render() {
		if (!this.hass || !this._config) {
			return html``;
		}

		// parse dates
		let startDate;
		let endDate;

		if(this._start_date_is == "entity"){
			this._stateObjStart = this.hass.states[this._config.start_date];
			if (!this._stateObjStart) {
				return html` <ha-card>Unknown start entity: ${this._config.start_date}</ha-card> `;
			}
			startDate = new Date(this._stateObjStart.state);
		}else if(this._start_date_is == "date"){
			
			startDate = new Date(this._config.start_date);
			if(startDate == "Invalid Date"){
				return html` <ha-card>Invalid start entity/date: ${this._config.start_date}</ha-card> `;
			}
		}else{
			return html` <ha-card>Invalid start entity/date: ${this._config.start_date}</ha-card> `;
		}

		if(this._end_date_is == "entity"){
			this._stateObjEnd = this.hass.states[this._config.end_date];
			if (!this._stateObjEnd) {
				return html` <ha-card>Unknown end entity: ${this._config.end_date}</ha-card> `;
			}
			endDate   = new Date(this._stateObjEnd.state);
		}else if(this._end_date_is == "date"){
			
			endDate = new Date(this._config.end_date);
			if(endDate == "Invalid Date"){
				return html` <ha-card>Invalid end entity/date: ${this._config.end_date}</ha-card> `;
			}
		}else{
			return html` <ha-card>Invalid end entity/date: ${this._config.end_date}</ha-card> `;
		}

		
		const msPerDay = 1000 * 60 * 60 * 24;
		const days = Math.max(1, Math.floor((endDate - startDate) / msPerDay));

		if(!this._bins_constant) {
			// Calculate bins dynamically
			this._bins = Math.min(days, 200);
			this._seqmentSize = 360 / this._bins;

			// todo optimize, no need to calculate every frame
			this._arcData = this._generateArcData();
			this._barData = this._generateBarData();
		}

		const now = this._toDateOnly(new Date());

		// Total duration between start and end
		const d_sec = (endDate - startDate); // 23 - 11 = 12
		
		let proc;
		let limitBin;
		let daysToGo = (endDate - now) / msPerDay;
		if (this._direction === "countup") {
			proc = (now - startDate) / d_sec;  // 19 - 11 = 8   => 8 / 12 = 0.66
	
			// Clamp between 0 and 1
			proc = Math.min(Math.max(proc, 0), 1);
			limitBin = Math.ceil(this._bins * proc); 
			daysToGo = Math.floor(daysToGo);
			// countup: 12 * 0.66 = 8

		} else { // countdown
			proc = (endDate - now) / d_sec;  // 23 - 19 = 4   	=> 4 / 12 = 0.33
			
			// Clamp between 0 and 1
			proc = Math.min(Math.max(proc, 0), 1);
			limitBin = Math.floor(this._bins * proc);   
			daysToGo = Math.floor(daysToGo);
			// countdown:  12 * 0.33 = 4
		}

		var colorData = this._generateArcColorData(limitBin);
		var textColor = this._getTextColor(proc);

		var icon;
		var icon_style;
		if (this._icon == "none") {
			icon = "";
			icon_style = "display:none;";
		} else {
			icon = this._icon;
		}


		var primary_info = "";
		if (!this._primaryInfo || this._primaryInfo == "none") {
			primary_info = "";
		} else {
			if(!this._primaryInfo)
				this._primaryInfo = "";
			
			primary_info =  this._primaryInfo.replace("[days]", daysToGo)
				.replace("[proc]", Math.round(proc * 100))
				.replace("[startdate]", startDate.toDateString())
				.replace("[enddate]", endDate.toDateString());
		}

		var secondary_info = "";
		if (!this._secondaryInfo || this._secondaryInfo == "none") {
			secondary_info = "";
		} else {
			if(!this._secondaryInfo)
				this._secondaryInfo = "";

			secondary_info = this._secondaryInfo.replace("[days]", daysToGo)
				.replace("[proc]", Math.round(proc * 100))
				.replace("[startdate]", startDate.toDateString())
				.replace("[enddate]", endDate.toDateString());
		}

		if (this._layout === "minimal") {
			return html`
        <ha-card>
          <div class="header">
            <div class="icon" style="${icon_style}">
              <ha-icon
                icon="${icon}"
                style="${this._colorState ? `color: ${textColor};"` : `""`};"
              ></ha-icon>
            </div>
            <div class="info">
              <span class="primary">${primary_info}</span>
              <span
                class="secondary"
                style="font-size:${this._secondaryInfoSize};"
                >${secondary_info}</span
              >
            </div>
          </div>
          <svg viewBox="0 0 100 10.2">
            <g transform="translate(0,0)">
              ${repeat(
								this._barData,
								(d) => d.id,
								(d, index) =>
									svg`<rect x=${d.x} y=${d.y} width=${d.width} height=${d.height} rx="1" fill=${colorData[index]} />`,
							)}
            </g>
          </svg>
        </ha-card>
      `;
		} else {
			return html`
        <ha-card>
		  <ha-icon 
			icon="${icon}"
			style="${this._colorState ? `color: ${textColor};scale: 3; position: absolute; top: 30%; left: 47.5%;` : `scale: 3; position: absolute; top: 30%; left: 47.5%;`}"
		  ></ha-icon>
          <svg viewBox="0 0 100 100">
            <g transform="translate(50,50)">
              ${repeat(
								this._arcData,
								(d) => d.id,
								(d, index) =>
									svg`<path class="arc" d=${d.arc} fill=${colorData[index]} />`,
							)}
            </g>
			
            <g transform="translate(50,50)">
              <text
                id="countdown"
                text-anchor="middle"
                dominant-baseline="central"
                fill=${textColor}
              >
                ${primary_info}
              </text>
            </g>
            <g transform="translate(50,62)">
              <text
                id="timer-name"
                text-anchor="middle"
                dominant-baseline="central"
                fill="var(--secondary-text-color)"
                style="font-size:${this._secondaryInfoSize};"
              >
			  ${secondary_info}
              </text>
            </g>
          </svg>
        </ha-card>
      `;
		}
	}

	_generateArcData() {
		var data = [];
		for (var i = 0; i < this._bins; i++) {
			data.push({
				arc: this._arc({
					start: i * this._seqmentSize,
					end: (i + 1) * this._seqmentSize,
				}),
				id: i,
			});
		}
		return data;
	}

	_generateBarData() {
		var pad = 1;

		var width = (100 + pad) / this._bins - pad;
		var height = 10;

		var data = [];
		for (var i = 0; i < this._bins; i++) {
			var x = i * (width + pad);
			var y = 0;

			data.push({ x: x, y: y, width: width, height: height, id: i });
		}
		return data;
	}

	_generateArcColorData(limitBin) {
		var data = [];
		let reverse = this._reverse_color
		for (var i = 0; i < this._bins; i++) {
			var color;
			if ((!reverse && i < limitBin) || (reverse && i >= limitBin)) {
				let scale = i / (this._bins - 1);
				if(reverse)
					scale = 1 - scale;
				color = this._colorScale(scale);
			} else {
				color = this._defaultTimerEmptyFill;
			}

			data.push(color);
		}
		return data;
	}

	_getTextColor(proc) {
		if (this._colorState) {
			let scale = proc;
			if(this._reverse_color)
				scale = 1 - scale;
			return this._colorScale(scale);
		} else {
			return this._stateColor;
		}
	}

	_toRadians(deg) {
		return deg * (Math.PI / 180);
	}

	_toDateOnly(d) {
		return new Date(d.getFullYear(), d.getMonth(), d.getDate());
	}
	

	static get styles() {
		return css`
      ha-card {
        padding: 10px;
      }

      path:hover {
        opacity: 0.85;
      }
      rect:hover {
        opacity: 0.85;
      }
      #countdown {
        font-weight: 600;
        font-size: 85%;
      }
      #timer-name {
        font-weight: 600;

        text-transform: capitalize;
      }
      #compact-countdown {
        font-weight: 600;
        font-size: 35%;
      }

      .header {
        display: flex;
        padding: 0px;
        justify-content: flex-start;
        cursor: pointer;

        margin-bottom: 10px;
      }

      ha-icon {
        color: rgba(189, 189, 189, 1);
      }

      .info {
        display: flex;
        flex-direction: column;
        justify-content: center;

        font-weight: 700;

        min-width: 0;
      }

      .info span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .primary {
        color: var(--primary-text-color);

        font-size: 14px;
      }

      .secondary {
        color: var(--secondary-text-color);
        text-transform: capitalize;
      }

      .icon {
        width: 42px;
        height: 42px;

        flex-shrink: 0;

        display: flex;
        align-items: center;
        justify-content: center;

        margin-right: 10px;

        background: rgba(34, 34, 34, 0.05);
        border-radius: 500px;
      }
    `;
	}
}

customElements.define("circular-countdown-card", CircularCountdownCard);

console.info(
	`%c circular-countdown-card | Version ${pkg.version} `,
	"color: white; font-weight: bold; background: #FF4F00",
);
