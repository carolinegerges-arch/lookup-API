(function($) {
// form submition
$(document).ready(function() {
	var resultDiv = $('#result')

	$('.clear').click(function(event) {
		resultDiv.removeClass('content')
		resultDiv.text('');
		$('#lookup_api').val('');
		$('#aggregate').val('');
	})
	$("form").submit(function(event) {
		//validate
		$('.error').hide()
		var formData = {
			lookup_api: $("#lookup_api").val(),
			aggregate: $("#aggregate").val(),
		};
		if (formData.lookup_api == '') {
			$('#lookup-api .error').show()
		}
		if (formData.aggregate == '') {
			$('#aggregate-field .error').show()
		}

		//if all field okay continue
		if (formData.lookup_api != '' && formData.aggregate != '') {
			var result = {};
			$.ajax({
				url: formData.lookup_api,
				success: function(data) {
					//check if valid response
					if (typeof data === 'object') {
						//check if aggregate field exist in obj
						var firstItem = data.items[0][formData.aggregate]
						if (firstItem != undefined) {
							var totalitems = data.pagination.items_total;
							$.ajax({

								url: formData.lookup_api + '&limit=' + totalitems,
								success: function(data) {
									var items = {};
									data.items.forEach(function(element) {
										var aggregate = element[formData.aggregate]
										if (aggregate != undefined) {
											if (items[aggregate] == undefined) {
												items[aggregate] = 1;
											} else {
												items[aggregate] += 1;
											}
										}
									});
									//sort it desc
									var ordered =  Object.fromEntries(
										Object.entries(items).sort(([, a], [, b]) => b-a)
									)
									result['items'] = ordered
									result['pagination'] = data.pagination;
									result['query'] = data.query;
								}
							}).done(function() {
								resultDiv.text(JSON.stringify(result));
								resultDiv.addClass('content')
								resultDiv.beautifyJSON({});
							})
						} else {
							result['message'] = 'This field ' + formData.aggregate +' not exist in json response body'
						}
					} else {
						result['message'] = 'Not valid json response from this api endpoint ' + formData.lookup_api
					}
				}
			}).done(function() {
				resultDiv.text(JSON.stringify(result, null, 2));
				resultDiv.addClass('content')
				resultDiv.beautifyJSON({});
			})

		}
		event.preventDefault();
	});
	function sortProperties(obj, isNumericSort)
{
	isNumericSort=isNumericSort || false; // by default text sort
	var sortable=[];
	for(var key in obj)
		if(obj.hasOwnProperty(key))
			sortable.push([key, obj[key]]);
	if(isNumericSort)
		sortable.sort(function(a, b)
		{
			return b[1]-a[1];
		});
	else
		sortable.sort(function(a, b)
		{
			var x=a[1].toLowerCase(),
				y=b[1].toLowerCase();
			return x<y ? -1 : x>y ? 1 : 0;
		});
	return sortable; // array in format [ [ key1, val1 ], [ key2, val2 ], ... ]
}
});
// beutify json
    $.fn.beautifyJSON = function(options) {
    	var defaults = {
    		type: "strict",
    		hoverable: true,
    		collapsible: true,
    		color: true
    	};
  		var settings = jQuery.extend({}, defaults, options);
    	this.each( function() {
    		if(settings.type == "plain") {
				var INCREMENT = "&ensp;&ensp;&ensp;";
	    		var s = [];
		    	var indent = "";
				var input = this.innerHTML;
				var output = input.split('"').map(function(v,i){
				   return i%2 ? v : v.replace(/\s/g, "");
				}).join('"');
				var text = "";
				function peek(stack) {
					var val = stack.pop();
					stack.push(val);
					return val;
				}
				for(i = 0; i < input.length; i++) {
					if(input.charAt(i) == '{') {
						s.push(input.charAt(i));
						text += input.charAt(i)+'<br>';
						indent += INCREMENT;
						text += indent;
					} else if(input.charAt(i) == '\"' && peek(s) != '\"') {
						text += input.charAt(i);
						s.push(input.charAt(i));
					} else if(input.charAt(i) == '[' && input.charAt(i+1) == ']') {
						s.push(input.charAt(i));
						text += input.charAt(i);
						indent += INCREMENT;
					} else if(input.charAt(i) == '[') {
						s.push(input.charAt(i));
						text += input.charAt(i)+'<br>';
						indent += INCREMENT;
						text += indent;
					} else if(input.charAt(i) == ']') {
						indent = indent.substring(0,(indent.length-18));
						text += '<br>'+indent;
						text += input.charAt(i)
						s.pop();
					} else if(input.charAt(i) == '}') {
						indent = indent.substring(0,(indent.length-18));
						text += '<br>'+indent+input.charAt(i);
						s.pop();
						if(s.length != 0)
							if(peek(s) != '[' && peek(s) != '{') {
								text += indent;
							}
					} else if(input.charAt(i) == '\"' && peek(s) == '\"') {
						text += input.charAt(i)
						s.pop();
					} else if(input.charAt(i) == ',' && peek(s) != '\"') {
						text += input.charAt(i)+'<br>';
						text += indent;
					} else if(input.charAt(i) == '\n') {
					} else if(input.charAt(i) == ' ' && peek(s) != '\"') {
					} else {
						text += input.charAt(i)
					}
				}
				this.innerHTML = text;
			} else if(settings.type == "flexible") {
				var s = [];
	    		var s_html = [];
				var input = this.innerHTML;
				var text = "";
				if(settings.collapsible) {
					var collapser = "<span class='ellipsis'></span><div class='collapser'></div><ul class='array collapsible'>";
				} else {
					var collapser = "<div></div><ul class='array'>";
				}
				if(settings.hoverable) {
					var hoverabler = "<div class='hoverable'>";
				} else {
					var hoverabler = "<div>"
				}
				text += "<div id='json'>";
				s_html.push("</div>");
				function peek(stack) {
					var val = stack.pop();
					stack.push(val);
					return val;
				}
				for(i = 0; i < input.length; i++) {
					if(input.charAt(i) == '{') {
						s.push(input.charAt(i));
						text += input.charAt(i);
						text += collapser;
						s_html.push("</ul>");
						text += "<li>"+hoverabler;
						s_html.push("</div></li>");
					} else if(input.charAt(i) == '\"' && peek(s) != '\"') {
						text += input.charAt(i);
						s.push(input.charAt(i));
					} else if(input.charAt(i) == '[' && input.charAt(i+1) == ']') {
						s.push(input.charAt(i));
						text += input.charAt(i);
						text += collapser;
						s_html.push("</ul>");
						text += "<li>"+hoverabler;
						s_html.push("</div></li>");
					} else if(input.charAt(i) == '[') {
						s.push(input.charAt(i));
						text += input.charAt(i);
						text += collapser;
						s_html.push("</ul>");
						text += "<li>"+hoverabler;
						s_html.push("</div></li>");
					} else if(input.charAt(i) == ']') {
						text += s_html.pop()+s_html.pop();
						text += input.charAt(i);
						// text += s_html.pop();
						s.pop();
					} else if(input.charAt(i) == '}') {
						text += s_html.pop()+s_html.pop();
						text += input.charAt(i);
						s.pop();
						if(s.length != 0)
							if(peek(s) != '[' && peek(s) != '{') {
								text += s_html.pop();
							}
					} else if(input.charAt(i) == '\"' && peek(s) == '\"') {
						text += input.charAt(i)
						s.pop();
					} else if(input.charAt(i) == ',' && peek(s) != '\"') {
						text += input.charAt(i);
						text += s_html.pop();
						text += "<li>"+hoverabler;
						s_html.push("</div></li>");
					} else if(input.charAt(i) == '\n') {
					} else if(input.charAt(i) == ' ' && peek(s) != '\"') {
					} else {
						text += input.charAt(i)
					}
				}
				this.innerHTML = text;
			} else {
    			var text = "";
				var s_html = [];
				if(settings.collapsible) {
					var collapser = "<span class='ellipsis'></span><div class='collapser'></div><ul class='array collapsible'>";
					var collapser_obj = "<span class='ellipsis'></span><div class='collapser'></div><ul class='obj collapsible'>";
				} else {
					var collapser = "<div></div><ul class='array'>";
					var collapser_obj = "<div></div><ul class='obj'>";
				}
				if(settings.hoverable) {
					var hoverabler = "<div class='hoverable'>";
				} else {
					var hoverabler = "<div>"
				}
				function peek(stack) {
					var val = stack.pop();
					stack.push(val);
					return val;
				}
				function iterateObject(object) {
					$.each(object, function(index, element) {
						if(element == null) {
							text += "<li>"+hoverabler+"<span class='property'>"+index+"</span>: <span class='type-null'>"+element+"</span></div></li>";
						} else if(element instanceof Array) {
							text += "<li>"+hoverabler+"<span class='property'>"+index+"</span>: "+"["+collapser;
							s_html.push("</li>");
							s_html.push("</div>");
							s_html.push("</ul>");
							iterateArray(element);
						} else if(typeof element == 'object') {
							text += "<li>"+hoverabler+"<span class='property'>"+index+"</span>: "+"{"+collapser_obj;
							s_html.push("</li>");
							s_html.push("</div>");
							s_html.push("</ul>");
							iterateObject(element);
						} else {
							if(typeof element == "number") {
								text += "<li>"+hoverabler+"<span class='property'>"+index+"</span>: <span class='type-number'>"+element+"</span></div></li>";
							} else if(typeof element == "string") {
								text += "<li>"+hoverabler+"<span class='property'>"+index+"</span>: <span class='type-string'>\""+element+"\"</span></div></li>";
							} else if(typeof element == "boolean") {
								text += "<li>"+hoverabler+"<span class='property'>"+index+"</span>: <span class='type-boolean'>"+element+"</span></div></li>";
							} else {
								text += "<li>"+hoverabler+"<span class='property'>"+index+"</span>: "+element+"</div></li>";
							}
						}
					});
					text += s_html.pop()+"}"+s_html.pop()+s_html.pop();
				}
				function iterateArray(array) {
					$.each(array, function(index, element) {
						if(element == null) {
							text += "<li>"+hoverabler+"<span class='property'>"+index+"</span>: <span class='type-null'>"+element+"</span></div></li>";
						} else if(element instanceof Array) {
							text += "<li>"+hoverabler+"["+collapser;
							s_html.push("</li>");
							s_html.push("</div>");
							s_html.push("</ul>");
							iterateArray(element);
						} else if(typeof element == 'object') {
							text += "<li>"+hoverabler+"{"+collapser_obj;
							s_html.push("</li>");
							s_html.push("</div>");
							s_html.push("</ul>");
							iterateObject(element);
						} else {
							if(typeof element == "number") {
								text += "<li>"+hoverabler+"<span class='property'>"+index+"</span>: <span class='type-number'>"+element+"</span></div></li>";
							} else if(typeof element == "string") {
								text += "<li>"+hoverabler+"<span class='property'>"+index+"</span>: <span class='type-string'>\""+element+"\"</span></div></li>";
							} else if(typeof element == "boolean") {
								text += "<li>"+hoverabler+"<span class='property'>"+index+"</span>: <span class='type-boolean'>"+element+"</span></div></li>";
							} else {
								text += "<li>"+hoverabler+"<span class='property'>"+index+"</span>: "+element+"</div></li>";
							}
						}
					});
					text += s_html.pop()+"]"+s_html.pop()+s_html.pop();
				}
				var input = this.innerHTML;
				var json = jQuery.parseJSON(input);
				text = "";
				text += "<div id='json'>";
				text += hoverabler+"{"+collapser_obj;
				s_html.push("");
				s_html.push("</div>");
				s_html.push("</ul>")
				iterateObject(json);
				text += "</ul></div></div>";
				this.innerHTML = text;
			}
			$('.hoverable').hover(function(event) {
				event.stopPropagation();
		    	$('.hoverable').removeClass('hovered');
		        $(this).addClass('hovered');
		    }, function(event) {
		    	event.stopPropagation();
		        // $('.hoverable').removeClass('hovered');
		        $(this).addClass('hovered');
		    });
		    $('.collapser').off().click(function(event) {
		    	$(this).parent('.hoverable').toggleClass('collapsed');
		    });
    	});
    }
}(jQuery));