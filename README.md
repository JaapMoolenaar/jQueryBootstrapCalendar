# jQuery Bootstrap Calendar

An effort to create a (very) basic bootstrap 3 calendar using jQuery. It's alpha, coded in less then a day. I needed it for a project, in which it works just fine for me.

I realize it's another calendar, but I needed an inline calendar which uses the basic bootstrap 3 styling, hence the templating.

Options available when initializing plugin:

* __locale__: "en", the locale set in moment.js
* __minDate__: false, a starting date for the calendar. A moment() or MM-DD-YYYY formatted string
* __maxDate__: false, a maximum date for the calendar. A moment() or MM-DD-YYYY formatted string
* __selectedDate__: false, The initialy selected date
* __startDay__: 1, The starting day, 0 for Sunday, 7 for Saturday
* __disabledDays__: [], An array of days to hide
* __dayDataCallback__: false, The return of this function will be set to a 'data' variable in the day template function(date = moment())
* __preRenderCallback__: false, A function which is called just before showing the calendar, callback needs to be called from it to resume rendering. Use this to laod calendar data before showing it. function(month, year, callback)
* __templates__: {
	* _main_:, The templates eblow get loaded in this one using the variables 'header', 'daynames' and 'days'
	* _header_: The header template, having month, monthname and year available
	* _daynames_: A header row to show day names, having daynames available
	* _daysrow_: The wrapper around the days, having days -as string- available
	* _day_: The template for one day. It has 'day' (day number), 'enabled' (false if below min or past max date), 'selected' (true if equal to selected data) and 'data' (the return from dayDataCallback) available.

### Dependencies

 * [moment.js](http://momentjs.com/) for easy date/time management
 * [jQuery](http://jquery.com/)
