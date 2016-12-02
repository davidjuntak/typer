var Word = Backbone.Model.extend({
	move: function() {
		this.set({y:this.get('y') + this.get('speed')});
	}
});

var Words = Backbone.Collection.extend({
	model:Word
});

var WordView = Backbone.View.extend({
	initialize: function() {
		$(this.el).css({position:'absolute'});
		var string = this.model.get('string');
		var letter_width = 25;
		var word_width = string.length * letter_width;
		if(this.model.get('x') + word_width > $(window).width()) {
			this.model.set({x:$(window).width() - word_width});
		}
		for(var i = 0;i < string.length;i++) {
			$(this.el)
				.append($('<div>')
					.css({
						width:letter_width + 'px',
						padding:'5px 2px',
						'border-radius':'4px',
						'background-color':'#fff',
						border:'1px solid #ccc',
						'text-align':'center',
						float:'left'
					})
					.text(string.charAt(i).toUpperCase()));
		}
		
		this.listenTo(this.model, 'remove', this.remove);
		
		this.render();
	},
	
	render:function() {
		$(this.el).css({
			top:this.model.get('y') + 'px',
			left:this.model.get('x') + 'px'
		});
		var highlight = this.model.get('highlight');
		$(this.el).find('div').each(function(index,element) {
			if(index < highlight) {
				$(element).css({'font-weight':'bolder','background-color':'#aaa',color:'#fff'});
			} else {
				$(element).css({'font-weight':'normal','background-color':'#fff',color:'#000'});
			}
		});
	}
});

var Score = Backbone.Model.extend({
	initialize: function() {
		this.set({value:0});
	},

	set_value: function(value) {
		this.set({value:value});
	},

	show_value: function() {
		alert('Your score is : ' + this.get('value'));
	}
});

var TyperView = Backbone.View.extend({
	initialize: function() {
		var wrapper = $('<div>')
			.css({
				position:'fixed',
				top:'0',
				left:'0',
				width:'100%',
				height:'100%'
			});
		this.wrapper = wrapper;
		
		var self = this;

		var score = self.model.get('score');
		
		var text_input = $('<input>')
			.addClass('form-control')
			.css({
				'border-radius':'4px',
				position:'absolute',
				bottom:'0',
				'min-width':'80%',
				width:'80%',
				'margin-bottom':'10px',
				'z-index':'1000'
			}).keyup(function() {
				var words = self.model.get('words');
				var matched = false;

				for(var i = 0;i < words.length;i++) {
					var word = words.at(i);
					var typed_string = $(this).val();
					var string = word.get('string');
					if(string.toLowerCase().indexOf(typed_string.toLowerCase()) == 0) {
						word.set({highlight:typed_string.length});
						matched = true;

						if(typed_string.length == string.length) {
							score.set_value(score.get('value') + typed_string.length);
							$(this).val('');
						}
					} else {
						word.set({highlight:0});
					}
				}

				if(!matched){
					if(score.get('value') > 0) {
						score.set_value(score.get('value') - 1);
					}
				}
				score_text.text(score.get('value'));
			});

		var start_button = $('<button>')
			.addClass('btn btn-default start')
			.append('<span class="glyphicon glyphicon-refresh"></span>')
			.click(function() {
				var confirmation = confirm('Restart the game?');
				if(confirmation) {
					location.reload();
				} else {
					text_input.focus();
				}
			});

		var stop_button = $('<button>')
			.addClass('btn btn-default stop')
			.append('<span class="glyphicon glyphicon-stop"></span>')
			.click(function() {
				var confirmation = confirm('Stop the game?');
				if(confirmation) {
					text_input.attr('disabled', 'disabled');
					self.model.pause();

					$(this).attr('disabled', '');
					pause_button.attr('disabled', '');
					resume_button.attr('disabled', '');

					score.show_value();
				} else {
					text_input.focus();
				}
			});

		var pause_button = $('<button>')
			.addClass('btn btn-default pause')
			.append('<span class="glyphicon glyphicon-pause"></span>')
			.click(function() {
				text_input.attr('disabled', 'disabled');
				self.model.pause();
			});

		var resume_button = $('<button>')
			.addClass('btn btn-default resume')
			.append('<span class="glyphicon glyphicon-play-circle"></span>')
			.click(function() {
				text_input.removeAttr('disabled');
				text_input.focus();
				self.model.start();
			});
		
		var button_wrapper = $('<div>')
			.css({
				'position':'absolute',
				'margin':'10px',
				'z-index':'1000'
			})
			.append(start_button, stop_button, pause_button, resume_button);

		var god_mode_checkbox = $('<input type="checkbox">')
			.addClass('god-mode');

		var god_mode_text = ' Mode Dewa Ngetik';

		var god_mode_wrapper = $('<div>')
			.css({
				position:'absolute',
				top:'35px',
				margin:'10px',
				'z-index':'1000'
			})
			.append(god_mode_checkbox, god_mode_text);

		var score_text = $('<h3>')
			.addClass('score')
			.css({
				'color':'red',
				'margin':'3px',
				'padding':'0px'
			})
			.text('0');

		var score_wrapper = $('<div>')
			.css({
				'position':'absolute',
				'right':'0',
				'margin':'10px',
				'z-index':'1000',
				'border-radius':'4px',
				'background-color':'#fff',
				'border':'1px solid #ccc',
				'text-align':'center',
				'width':'100px'
			})
			.append(score_text);
		
		$(this.el)
			.append(wrapper
				.append($('<form>')
					.attr({
						role:'form'
					})
					.submit(function() {
						return false;
					})
					.append(text_input, button_wrapper, god_mode_wrapper, score_wrapper)));
		
		text_input.css({left:((wrapper.width() - text_input.width()) / 2) + 'px'});
		text_input.focus();
		
		this.listenTo(this.model, 'change', this.render);
	},
	
	render: function() {
		var model = this.model;
		var words = model.get('words');
		
		for(var i = 0;i < words.length;i++) {
			var word = words.at(i);
			if(!word.get('view')) {
				var word_view_wrapper = $('<div>');
				this.wrapper.append(word_view_wrapper);
				word.set({
					view:new WordView({
						model: word,
						el: word_view_wrapper
					})
				});
			} else {
				word.get('view').render();
			}
		}
	}
});

var Typer = Backbone.Model.extend({
	defaults:{
		max_num_words:10,
		min_distance_between_words:50,
		words:new Words(),
		min_speed:1,
		max_speed:2,
		score:new Score(),
		timer:null
	},
	
	initialize: function() {
		new TyperView({
			model: this,
			el: $(document.body)
		});
	},

	start: function() {
		var animation_delay = 30;
		var self = this;
		
		if(!this.timer) {
			this.timer = setInterval(function() {
				self.iterate();
			},animation_delay)
		}
	},

	pause: function() {
		clearInterval(this.timer);
		this.timer = null;
	},
	
	iterate: function() {
		var words = this.get('words');
		if(words.length < this.get('max_num_words')) {
			var top_most_word = undefined;
			for(var i = 0;i < words.length;i++) {
				var word = words.at(i);
				if(!top_most_word) {
					top_most_word = word;
				} else if(word.get('y') < top_most_word.get('y')) {
					top_most_word = word;
				}
			}
			
			if(!top_most_word || top_most_word.get('y') > this.get('min_distance_between_words')) {
				var random_company_name_index = this.random_number_from_interval(0,company_names.length - 1);
				var string = company_names[random_company_name_index];
				var filtered_string = '';
				for(var j = 0;j < string.length;j++) {
					if(/^[a-zA-Z()]+$/.test(string.charAt(j))) {
						filtered_string += string.charAt(j);
					}
				}
				
				var word = new Word({
					x:this.random_number_from_interval(0,$(window).width()),
					y:0,
					string:filtered_string,
					speed:this.random_number_from_interval(this.get('min_speed'),this.get('max_speed'))
				});
				words.add(word);
			}
		}
		
		var words_to_be_removed = [];
		for(var i = 0;i < words.length;i++) {
			var word = words.at(i);
			word.move();
			
			if(word.get('y') > $(window).height() || word.get('move_next_iteration')) {
				words_to_be_removed.push(word);

				if ($('.god-mode').is(':checked')) {
					$('.word_input').attr('disabled', 'disabled');
					this.pause();

					$('.stop').attr('disabled', '');
					$('.pause').attr('disabled', '');
					$('.resume').attr('disabled', '');

					this.get('score').show_value();
				}
			}
			
			if(word.get('highlight') && word.get('string').length == word.get('highlight')) {
				word.set({move_next_iteration:true});
			}
		}
		
		for(var i = 0;i < words_to_be_removed.length;i++) {
			words.remove(words_to_be_removed[i]);
		}
		
		this.trigger('change');
	},
	
	random_number_from_interval: function(min,max) {
	    return Math.floor(Math.random()*(max-min+1)+min);
	}
});