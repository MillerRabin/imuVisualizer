class Vector extends HTMLElement {
    #vector = { x: 0, y: 0, z: 0 };
    
    #template =
      `<label>
          <span>X:</span>
          <input class="x" type="number" value="0" name="x"/>
        </label>
        <label>
          <span>Y:</span>
          <input class="y" type="number" value="0" name="y"/>
        </label>
        <label>
          <span>Z:</span>
          <input class="z" type="number" value="0" name="z"/>
        </label>  
      `;
  
    constructor() {
      super();
    }
  
    #handleInput = (event) => {
      const target = event.target;
      const name = (target.name == 'x') ? 'x' :
                   (target.name == 'y') ? 'y' :
                   (target.name == 'z') ? 'z' : 
                   null
      if (name == null) return;      
      this.#vector[name] = target.value;
    }
  
    #enableInputs() {
      this.components.roll.oninput = this.#handleInput;
      this.components.pitch.oninput = this.#handleInput;
      this.components.yaw.oninput = this.#handleInput;
    }
  
    get vector() {
      return this.#vector;
    }
  
    async connectedCallback() {    
      this.innerHTML = this.#template;
      this.components = {
        roll: this.querySelector('.x'),
        pitch: this.querySelector('.y'),
        yaw: this.querySelector('.z'),
      };
  
      this.#enableInputs();    
    }
  
    async disconnectedCallback() { }
  }
  
  customElements.define('edit-vector', Vector);
  