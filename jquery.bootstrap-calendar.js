;(function ($, window, document, moment, undefined) {

    "use strict";

    // Create the defaults once
    var pluginName = "calendar";
    $[ pluginName ] = {}
    $[ pluginName ].defaults = {
        locale: "en",
        minDate: false,
        maxDate: false,
        selectedDate: false,
        startDay: 1,
        disabledDays: [],
        dayDataCallback: false, // function(date)
        preRenderCallback: false, // function(month, year, callback)

        templates: {
              main: '<table class="table table-bordered table-condensed calendar"><%= header %><%= daynames %><%= days %></table>'
            , header:
                '<tr>'
                    + '<th colspan="7">'
                        + '<div class="row calendar-button-row">'
                            + '<div class="col-xs-3">'
                                + '<button type="button" class="btn btn-default pull-left" data-calendar-action="prevmonth"><small><i class="fa fa-chevron-left"></i></small></button>'
                            + '</div>'
                            + '<div class="col-xs-6 text-center">'
                                + '<h5><%= monthname %>&nbsp;<%= year %></h5>'
                            + '</div>'
                            + '<div class="col-xs-3">'
                                + '<button type="button" class="btn btn-default pull-right" data-calendar-action="nextmonth"><small><i class="fa fa-chevron-right"></i></small></button>'
                            + '</div>'
                        + '</div>'
                    + '</th>'
                + '</tr>'
            , daynames:
                '<tr class="calendar-header calendar-daynames-row">'
                    + '<% $.each(daynames, function(index, day) { %>'
                        + '<th class="text-center"><%= day.dayname %></th>'
                    + '<% }); %>'
                + '</tr>'
            , daysrow:
                '<tr><%= days %></tr>'
            , day:
                '<td class="calendar-day text-center <% if(othermonth) { %> calendar-day-othermonth<% } %><% if(!enabled) { %> calendar-day-disabled<% } %><% if(selected) { %> active<% } %>">'
                    // day = 0 means before starting day, or after last day
                    + '<% if(!othermonth) { %>'
                        // enabled = true means it's in the min/maxDate range
                        + '<% if(enabled) { %>'
                            + '<a class="btn btn-link btn-block btn-day calendar-day" data-calendar-day="<%= day %>" data-calendar-action="selectday"><%= day %></a>'
                        + '<% } else { %>'
                            + '<span class="btn btn-link btn-block btn-day calendar-day disabled" data-calendar-day="<%= day %>" data-calendar-action="selectdisabledday"><%= day %></span>'
                        + '<% } %>'
                    + '<% } %>'
                + '</td>'

        }
    };

    // The actual plugin constructor
    function Plugin(element, options) {
        this._defaults = $[ pluginName ].defaults;

        this.element = element[0];
        this.$element = element;
        this.settings = $.extend(true, {}, this._defaults, options);

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        month: moment().month(),
        year: moment().year(),
        selected: false,
        templates: {},
        init: function () {
            if(this.settings.minDate) {
                this.settings.minDate = moment(moment.isMoment(this.settings.minDate) ? this.settings.minDate.format("MM-DD-YYYY") : this.settings.minDate, "MM-DD-YYYY");
            }
            if(this.settings.maxDate) {
                this.settings.maxDate = moment(moment.isMoment(this.settings.maxDate) ? this.settings.maxDate.format("MM-DD-YYYY") : this.settings.maxDate, "MM-DD-YYYY");
            }
            if(this.settings.selectedDate) {
                this.selected = moment(moment.isMoment(this.settings.selectedDate) ? this.settings.selectedDate.format("MM-DD-YYYY") : this.settings.selectedDate, "MM-DD-YYYY");

                this.month = this.selected.month();
                this.year = this.selected.year();
            }

            for(var templatename in this.settings.templates) {
                this.templates[templatename] =
                    $.template.compileTemplate(this.settings.templates[templatename]);
            }

            this.setLocale(this.settings.locale);

            var check = this.checkMonth();
            if(check.pastmin) {
                this.month = this.settings.minDate.month();
                this.year = this.settings.minDate.year();
            }
            else if(check.pastmax) {
                this.month = this.settings.maxDate.month();
                this.year = this.settings.maxDate.year();
            }

            this.renderHtml();
        },
        checkDate: function(day) {
            var result = {pastmin: false, pastmax: false},
                check = moment().month(this.month).year(this.year).date(day);

            if(check.isBefore(this.settings.minDate)){
                result.pastmin = true;
            }

            if(check.isAfter(this.settings.maxDate)){
                result.pastmax = true;
            }

            return result;
        },
        checkMonth: function(month) {
            var minresult = this.checkDate(1),
                maxresult = this.checkDate(daysInMonth(month));

            return {pastmin: minresult.pastmin, pastmax: maxresult.pastmax};
        },
        renderLoadingstate: function() {
            var blur = '2px';
            this.$element.find('.calendar').css({
                '-webkit-filter': 'blur('+blur+')',
                '-moz-filter': 'blur('+blur+')',
                '-o-filter': 'blur('+blur+')',
                '-ms-filter': 'blur('+blur+')',
                'filter': 'blur('+blur+')',
            });

            this.$element.css({
                position: 'relative',
                zIndex: 0,
            });
            var $loader = $('<div class="calendar-loader">').css({
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255,255,255,0.5)',
                zIndex: 1,
            });

            this.$element.prepend($loader);
        },
        removeLoadingstate: function() {
            this.$element.find('.calendar-loader').remove();
        },
        renderHtml: function (year, month) {
            if(typeof year === 'undefined') year = this.year;
            if(typeof month === 'undefined') month = this.month;

            this.renderLoadingstate();

            var render = function () {
                // get first day of month
                var firstDay = new Date(year, month, 1);
                var startingDay = firstDay.getDay();

                // find number of days in month
                var monthLength = daysInMonth(month);

                // compensate for leap year
                if (month === 1) { // February only!
                    if (moment().isLeapYear()) {
                        monthLength = 29;
                    }
                }

                // Check if the month can be displayed
                var checkmonth = this.checkMonth(month);

                var htmlparts = {
                    header: '',
                    daynames: '',
                    days: '',
                    month: month,
                    monthname: monthName(month),
                    year: year,
                    check: checkmonth
                }

                htmlparts.header = this.templates.header({month: month, monthname: monthName(month), year: year});

                var daynames = [];
                for (var i = this.settings.startDay; i <= this.settings.startDay+6; i++) {
                    var dow = moment().day(i).day(),
                        hidden = this.settings.disabledDays.indexOf(dow) !== -1;

                    if(!hidden) {
                        daynames.push({
                            day: dow,
                            dayname: dayName(dow)
                        });
                    }
                }

                htmlparts.daynames = this.templates.daynames({daynames: daynames});

                // fill in the days
                var day = 1, started = false;

                // this loop is for is weeks (rows)
                for (var i = 0; i < 9; i++) {
                    var days = [];
                    var showndays = 0;

                    // this loop is for weekdays (cells)
                    for (var j = this.settings.startDay; j <= this.settings.startDay+6; j++) {
                        var dow = moment().day(j).day(),
                            hidden = this.settings.disabledDays.indexOf(dow) !== -1;

                        if(!started) {
                            if(dow === startingDay) {
                                started = true;
                            }
                        }

                        if (day <= monthLength && started) {
                            if(!hidden) {
                                var check = this.checkDate(day),
                                    mnt = moment((this.month+1)+'-'+day+'-'+this.year, "MM-DD-YYYY"),
                                    selected = this.selected && this.selected.isSame(mnt),
                                    extra = {};

                                if(this.settings.dayDataCallback) {
                                    extra = this.settings.dayDataCallback(mnt);
                                    if(!extra) {
                                        extra = {}
                                    }
                                }

                                days.push(this.templates.day({
                                    day: day,
                                    enabled: !check.pastmin && !check.pastmax,
                                    selected: selected,
                                    othermonth: false,
                                    data: extra
                                }));
                                showndays++;
                            }
                            day++;
                        } else if(!hidden) {
                            days.push(this.templates.day({
                                day: 0,
                                enabled: false,
                                selected: false,
                                othermonth: true,
                                data: {}
                            }));
                        }
                    }

                    if(days.length > 0 && showndays > 0) {
                        htmlparts.days += this.templates.daysrow({days: days.join('')})
                    }

                    // stop making rows if we've run out of days
                    if (day > monthLength) {
                        break;
                    }
                }

                var html = this.templates.main(htmlparts);

                var _this = this;
                this.$element.html(html);
                this.$element.find('[data-calendar-action]').each(function(){
                    var $this = $(this),
                        action = $this.data('calendar-action');

                    switch(action) {
                        case 'prevmonth': $this.click(function(){ _this.prevMonth() }); break;
                        case 'nextmonth': $this.click(function(){ _this.nextMonth() }); break;
                        case 'prevyear':  $this.click(function(){ _this.prevYear() }); break;
                        case 'nextyear':  $this.click(function(){ _this.nextYear() }); break;
                        case 'selectday': $this.click(function(){ _this.selectDay($this.data('calendar-day')); }); break;
                    }
                });

                if(checkmonth.pastmin) {
                    this.$element.find('[data-calendar-action="prevmonth"]').addClass('disabled');
                }
                if(checkmonth.pastmax) {
                    this.$element.find('[data-calendar-action="nextmonth"]').addClass('disabled');
                }

                this.removeLoadingstate();
            }.bind(this)

            if(this.settings.preRenderCallback) {
                this.settings.preRenderCallback(month, year, render);
            } else {
                render();
            }
        },
        public: {
            setMonth: function(month) {
                this.month = month;

                if(this.month < 0) {
                    this.month = 11;
                    this.year--;
                }

                if(this.month > 11) {
                    this.month = 0;
                    this.year++;
                }

                this.renderHtml();
                this.$element.trigger('calendar.setmonth', [this.month]);
            },
            prevMonth: function() {
                this.setMonth(this.month-1);
            },
            nextMonth: function() {
                this.setMonth(this.month+1);
            },

            setYear: function(year) {
                this.year = year;

                this.renderHtml();
                this.$element.trigger('calendar.setyear', [this.year]);
            },
            prevYear: function() {
                this.setYear(this.year+1);
            },
            nextYear: function() {
                this.setYear(this.year-1);
            },

            setMonthYear: function(month, year) {
                this.month = month;
                this.year = year;

                this.renderHtml();
                this.$element.trigger('calendar.setmonthyear', [this.year]);
            },

            setLocale: function (locale) {
                // incase of a format like nl-NL
                this.settings.locale = locale.substr(0, 2);

                // Set the locale in moment.js
                moment.locale(this.settings.locale);
            },

            selectDay: function(day) {
                this.selected = moment((this.month+1)+'-'+day+'-'+this.year, "MM-DD-YYYY");

                this.$element.find('.active').removeClass('active');
                this.$element.find('[data-calendar-day="'+day+'"]').parent().addClass('active');
                this.$element.trigger('calendar.selectday', [moment((this.month+1)+'-'+day+'-'+this.year, "MM-DD-YYYY")]);
            }
        }
    });

    function monthName(month) {
        var monthname = moment().month(month).format('MMMM');

        return monthname.charAt(0).toUpperCase() + monthname.slice(1);
    }

    function dayName(day) {
        var dayname = moment().day(day).format('ddd');

        return dayname.charAt(0).toUpperCase() + dayname.slice(1);
    }

    function daysInMonth(month) {
        if (month === 1) {
            if (moment().isLeapYear()) {
                return 29;
            }
            else {
                return 28;
            }
        }
        else if (month < 7) {
            return month % 2 === 0 ? 31 : 30;
        }
        else {
            return month % 2 === 0 ? 30 : 31;
        }
    };

    // Make sure the plugin's public methods are made available to be called
    // using .pluginname('methodname')
    for(var method in Plugin.prototype.public) {
        Plugin.prototype[method] = (function(method){
            return function() {
                return this.public[method].apply(this, Array.prototype.slice.call(arguments));
            }
        })(method);
    }

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[ pluginName ] = function () {
        var args = Array.prototype.slice.call(arguments),
            dataname = "plugin_" + pluginName,
            getInstance = function(element) {
                return element.data(dataname);
            },
            setInstance = function(element, instance) {
                element.data(dataname, instance);
                return instance;
            };

        // Call a method and return it's results if possible
        // which it only is if the funciton is called on just one element
        if(this instanceof jQuery && this.length === 1) {
            // get an instance of Plugin
            var instance = getInstance(this);

            // if the instance does not exist, create it
            if (!instance) {
                instance = setInstance(this, new Plugin(this, typeof args[0] === 'undefined' || typeof args[0] === 'object' ? args.shift() : undefined));
            }

            // See if a method has been called
            if(typeof args[0] === 'string' && typeof instance.public[args[0]] === 'function') {
                return instance.public[args.shift()].apply(instance, args);
            }

            return this;
        }
        else {
            // instantiate or call method on all elements
            return this.each(function () {
                $.fn[ pluginName ].apply($(this), args);
            });
        }
    };

})(jQuery, window, document, moment);