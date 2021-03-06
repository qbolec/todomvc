/* ---------------------------------------------------------------------------------------
Todos.ts
Microsoft grants you the right to use these script files under the Apache 2.0 license. 
Microsoft reserves all other rights to the files not expressly granted by Microsoft, 
whether by implication, estoppel or otherwise. The copyright notices and MIT licenses 
below are for informational purposes only.

Portions Copyright © Microsoft Corporation
Apache 2.0 License

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this 
file except in compliance with the License. You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under 
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF 
ANY KIND, either express or implied.

See the License for the specific language governing permissions and limitations 
under the License.
------------------------------------------------------------------------------------------
Provided for Informational Purposes Only
MIT License
Permission is hereby granted, free of charge, to any person obtaining a copy of this 
software and associated documentation files (the "Software"), to deal in the Software 
without restriction, including without limitation the rights to use, copy, modify, merge, 
publish, distribute, sublicense, and/or sell copies of the Software, and to permit 
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies 
or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE 
FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR 
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
DEALINGS IN THE SOFTWARE.
--------------------------------------------------------------------------------------- */
// Todos.js
// https://github.com/documentcloud/backbone/blob/master/examples/todos/todos.js

// An example Backbone application contributed by
// [Jérôme Gravel-Niquet](http://jgn.me/). This demo uses a simple
// [LocalStorage adapter](backbone-localstorage.js)
// to persist Backbone models within your browser.

///<reference path="./libs/backbone/backbone.d.ts" />
declare var _: any;
declare var Store: any;


// Todo Model
// ----------

// Our basic **Todo** model has `content`, `order`, and `done` attributes.
class Todo extends Backbone.Model {

	// Default attributes for the todo.
	defaults() {
		return {
			content: '',
			done: false
		}
	}

	// Ensure that each todo created has `content`.
	initialize() {
		if (!this.get('content')) {
			this.set({ 'content': this.defaults().content });
		}
	}

	// Toggle the `done` state of this todo item.
	toggle() {
		this.save({ done: !this.get('done') });
	}

	// Remove this Todo from *localStorage* and delete its view.
	clear() {
		this.destroy();
	}

}

// Todo Collection
// ---------------

// The collection of todos is backed by *localStorage* instead of a remote
// server.
class TodoList extends Backbone.Collection {

	// Reference to this collection's model.
	model = Todo;

	// Save all of the todo items under the `'todos'` namespace.
	localStorage = new Store('todos-typescript-backbone');

	// Filter down the list of all todo items that are finished.
	done() {
		return this.filter((todo: Todo) => todo.get('done'));
	}

	// Filter down the list to only todo items that are still not finished.
	remaining() {
		return this.without.apply(this, this.done());
	}

	// We keep the Todos in sequential order, despite being saved by unordered
	// GUID in the database. This generates the next order number for new items.
	nextOrder() {
		if (!length) return 1;
		return this.last().get('order') + 1;
	}

	// Todos are sorted by their original insertion order.
	comparator(todo: Todo) {
		return todo.get('order');
	}

}

// Create our global collection of **Todos**.
var Todos = new TodoList();

// Todo Item View
// --------------

// The DOM element for a todo item...
class TodoView extends Backbone.View {

	// The TodoView listens for changes to its model, re-rendering. Since there's
	// a one-to-one correspondence between a **Todo** and a **TodoView** in this
	// app, we set a direct reference on the model for convenience.
	template: (data: any) => string;

	// A TodoView model must be a TodoControl, redeclare with specific type
	model: TodoControl;
	input: any;

	static ENTER_KEY:number = 13;

        events(){
          return {
            'click .check': () => this.trigger('toggleDone'),
            'dblclick label.todo-content': () => this.trigger('startEditing'),
            'click button.destroy': () => this.trigger('clear'),
            'keypress .todo-input': 'updateOnEnter',
            'blur .todo-input': () => this.trigger('close')
          };
        }
	constructor (options? ) {
		//... is a list tag.
		this.tagName = 'li';

		// The DOM events specific to an item.

		super(options);

		// Cache the template function for a single item.
		this.template = _.template($('#item-template').html());

		_.bindAll(this, 'render', 'close', 'remove');
		this.model.get('todoModel').bind('change', this.render);
                this.listenTo(this.model,'change:editing',(model,editing)=>{
                  if(editing){
                    this.edit();
                  }else{
                    this.close();
                  }
                });
	}

	// Re-render the contents of the todo item.
	render() {
		this.$el.html(this.template(this.model.get('todoModel').toJSON()));
		this.input = this.$('.todo-input');
		return this;
	}

	// Switch this view into `'editing'` mode, displaying the input field.
	edit() {
		this.$el.addClass('editing');
		this.input.focus();
	}

	// Close the `'editing'` mode, saving changes to the todo.
	close() {
		this.$el.removeClass('editing');
	}

	// If you hit `enter`, we're through editing the item.
	updateOnEnter(e) {
		if (e.keyCode == TodoView.ENTER_KEY) this.trigger('close');
	}

        getText(){
          return this.input.val();
        }

}
class Control extends Backbone.Model {
  view : Backbone.View;
  getEl(){
    return this.view.el;
  }
  initialize(){
    this.listenTo(this,'destroy', ()=> this.view.remove());
  }
}
class TodoControl extends Control {
  view : TodoView;
  defaults() {
    return {
      editing: false,
    }
  }
  private resetView(){
    this.view = new TodoView({model:this});
    this.listenTo(this.view,'toggleDone', () => this.get('todoModel').toggle());
    this.listenTo(this.view,'startEditing', () => this.set('editing',true));
    this.listenTo(this.view,'close', () => this.set('editing',false));
    this.listenTo(this.view,'close', () => {
      this.get('todoModel').save({ content: this.view.getText() });
    });
    this.listenTo(this.view,'clear', () => this.get('todoModel').clear());
  }
  public initialize(){
    super.initialize();
    this.resetView();
    this.listenTo(this.get('todoModel'),'destroy', () => this.trigger('destroy'));
  }
}

// The Application
// ---------------

// Our overall **AppView** is the top-level piece of UI.
class AppView extends Backbone.View {

	// Delegated events for creating new items, and clearing completed ones.
	events = {
		'keypress #new-todo': 'createOnEnter',
		'click .todo-clear button': 'clearCompleted',
		'click .mark-all-done': 'toggleAllComplete'
	};

	input: any;
	allCheckbox: HTMLInputElement;
	mainElement: HTMLElement;
	footerElement: HTMLElement;
	statsTemplate: (params: any) => string;

	constructor () {
		super();
		// Instead of generating a new element, bind to the existing skeleton of
		// the App already present in the HTML.
		this.setElement($('#todoapp'), true);

		// At initialization we bind to the relevant events on the `Todos`
		// collection, when items are added or changed. Kick things off by
		// loading any preexisting todos that might be saved in *localStorage*.
		_.bindAll(this, 'addOne', 'addAll', 'render', 'toggleAllComplete');

		this.input = this.$('#new-todo');
		this.allCheckbox = <HTMLInputElement>this.$('.mark-all-done')[0];
		this.mainElement = this.$('#main')[0];
		this.footerElement = this.$('#footer')[0];
		this.statsTemplate = _.template($('#stats-template').html());

		Todos.bind('add', this.addOne);
		Todos.bind('reset', this.addAll);
		Todos.bind('all', this.render);

		Todos.fetch();
	}

	// Re-rendering the App just means refreshing the statistics -- the rest
	// of the app doesn't change.
	render() {
		var done = Todos.done().length;
		var remaining = Todos.remaining().length;

		if (Todos.length) {
			this.mainElement.style.display = 'block';
			this.footerElement.style.display = 'block';

			this.$('#todo-stats').html(this.statsTemplate({
				total: Todos.length,
				done: done,
				remaining: remaining
			}));
		} else {
			this.mainElement.style.display = 'none';
			this.footerElement.style.display = 'none';
		}

		this.allCheckbox.checked = !remaining;
                return this;
	}

	// Add a single todo item to the list by creating a view for it, and
	// appending its element to the `<ul>`.
	addOne(todo) {
		var control = new TodoControl({ todoModel: todo });
		this.$('#todo-list').append(control.getEl());
                this.listenTo(control,'change:todoModel',(control,todo)=>{
                  if(!todo){
                    control.destroy();
                  }
                });
	}

	// Add all items in the **Todos** collection at once.
	addAll() {
		Todos.each(this.addOne);
	}

	// Generate the attributes for a new Todo item.
	newAttributes() {
		return {
			content: this.input.val(),
			order: Todos.nextOrder(),
			done: false
		};
	}

	// If you hit return in the main input field, create new **Todo** model,
	// persisting it to *localStorage*.
	createOnEnter(e) {
		if (e.keyCode != 13) return;
		Todos.create(this.newAttributes());
		this.input.val('');
	}

	// Clear all done todo items, destroying their models.
	clearCompleted() {
		_.each(Todos.done(), (todo: Todo) => todo.clear());
		return false;
	}

	toggleAllComplete() {
		var done = this.allCheckbox.checked;
		Todos.each((todo: Todo) => todo.save({ 'done': done }));
	}

}

// Load the application once the DOM is ready, using `jQuery.ready`:
$(() => {
	// Finally, we kick things off by creating the **App**.
	new AppView();
});
