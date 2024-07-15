class Euler extends HTMLElement {
  #vector = { x: 0, y: 0, z: 0 };
  
  #template =
    `<h3>Rotation Vector</h3>
      <label>
        <span>Roll:</span>
        <input class="roll" type="number" value="0" name="roll"/>
      </label>
      <label>
        <span>Pitch:</span>
        <input class="pitch" type="number" value="0" name="pitch"/>
      </label>
      <label>
        <span>Yaw:</span>
        <input class="yaw" type="number" value="0" name="yaw"/>
      </label>  
    `;

  constructor() {
    super();
  }

  #handleInput = (event) => {
    const target = event.target;
    const name = (target.name == 'roll') ? 'x' :
                 (target.name == 'pitch') ? 'y' :
                 (target.name == 'yaw') ? 'z' : 
                 null
    if (name == null) return;
    const value = target.value * Math.PI / 180;
    this.#vector[name] = value;
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
      roll: this.querySelector('.roll'),
      pitch: this.querySelector('.pitch'),
      yaw: this.querySelector('.yaw'),
    };

    this.#enableInputs();    
  }

  async disconnectedCallback() { }
}

customElements.define('imu-euler', Euler);
