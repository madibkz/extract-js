	window = this;
	self = this;

	_globalTimeOffset = 0;
	WScript.sleep = function(delay) {
		_globalTimeOffset += delay;
	}

	let fullYearGetter = Date.prototype.getFullYear;
	Date.prototype.getFullYear = function() {
		if (/*date.year print start*/true/*date.year print end*/) {
			console.log("Warning: the script tried to read the current date.");
			console.log("If it doesn't work correctly (eg. fails to decrypt a string,");
			console.log("try editing patch.js with a different year.");
		}

		// return 2017;
		return /*date.year start*/fullYearGetter.call(this)/*date.year end*/;
	};
	Date.prototype.getTime = /*date.time start*/Date.prototype.getTime/*date.time end*/;
	Date.prototype.getYear = function() {
		return this.getFullYear();
	};
	Date.prototype.toString = function() {
		// Example format: Thu Aug 24 18:17:18 UTC+0200 2017
		const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][this.getDay()];
		const monName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][this.getMonth()];
		return [
			dayName, monName, this.getUTCDay(),
			this.getUTCHours() + ":" + this.getUTCMinutes() + ":" + this.getUTCSeconds(),
			"UTC-0500", // New York timezone
			this.getFullYear()
		].join(" ");
	}
	const legacyDate = Date;
	Date = function() {
		return new Proxy({
			_actualTime: new legacyDate(...arguments),
		}, {
			get: (target, prop) => {
				const modifiedDate = new legacyDate(target._actualTime.getTime() + _globalTimeOffset);
				if (prop === Symbol.toPrimitive) return hint => {
					switch (hint) {
						case "string":
						case "default":
							return modifiedDate.toString();
						case "number":
							return modifiedDate.getTime();
						default:
							throw new Error("Unknown hint!");
					}
				}
				if (typeof prop !== "symbol") {
					if (!(prop in modifiedDate) && (prop in legacyDate)) return legacyDate[prop];
					if (!(prop in legacyDate.prototype)) return undefined;                
				}
				const boundFn = modifiedDate[prop].bind(modifiedDate);
				return function() {
					const ret = boundFn.apply(null, arguments);
					target._actualTime = new legacyDate(modifiedDate.getTime() - _globalTimeOffset);
					return ret;
				}
			}
		});
	}
	Date.now = () => /*date.now start*/legacyDate.now() + _globalTimeOffset/*date.now end*/;
	Date.length = 7;
	Date.parse = legacyDate.parse;
	Date.UTC = legacyDate.UTC;
	Date.toString = () => legacyDate.toString()
	Date.valueOf  = () => legacyDate.valueOf()

	Array.prototype.Count = function() {
		return this.length;
	};

	let _OriginalFnToString = Function.prototype.toString;
	Function.prototype.toString = function() {
		/**
		 * WSH's toString() looks a bit different for built-in functions
		 * than result generated by Node.js (tabbed and wrapped with newlines)
		 * which is sometimes checked by malicious scripts.
		 */
		let source = _OriginalFnToString.call(this);
		return source.replace(
			/^function (\S+) { \[native code\] }$/,
			((m, fnName) => `\nfunction ${fnName} {\n    [native code]\n}\n`)
		)
	}

	let _OriginalFunction = Function;
	Function = function(...args) {
		let originalSource = args.pop();
		let source;
		if (typeof originalSource === "function") {
			originalSource = originalSource.toString();
			source = rewrite("(" + originalSource + ")");
		} else if (typeof originalSource === "string") {
			source = `/* Function arguments: ${JSON.stringify(args)} */\n` + rewrite(originalSource.replace(/`/gi, "\\`"));
		} else {
			// Wtf JS
			// For some reason, IIFEs result in a call to Function.
			return new _OriginalFunction(...args, source);
		}
		logJS(source, "function_constructor_", "", true, null, "JS found in a function constructor call");
		return new _OriginalFunction(...args, source);
	}
	Function.toString = () => _OriginalFunction.toString()
	Function.valueOf  = () => _OriginalFunction.valueOf()
	Function.toString(); //Fixes some error with function not being reloaded for the first function run after patches

	toggleLogDOM();
/* End patches */
