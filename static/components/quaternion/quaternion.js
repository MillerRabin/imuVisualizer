class Quaternion extends HTMLElement {
  #quaternion = { x: 0, y: 0, z: 0 };

  #template =
      `<label>
          <span>real:</span>
          <input class="real" type="number" value="0" step="0.01" name="real"/>
        </label>
        <label>
            <span>i:</span>
            <input class="i" type="number" value="0" step="0.01" name="i"/>
        </label>
        <label>
          <span>j:</span>
          <input class="j" type="number" value="0" step="0.01" name="j"/>
        </label>
        <label>
          <span>k:</span>
          <input class="k" type="number" value="0" step="0.01" name="k"/>
        </label>  
      `;

  constructor() {
    super();
  }

  #handleInput = (event) => {
    const target = event.target;
    const name = (target.name == 'i') ? 'real' :
                 (target.name == 'i') ? 'i' :
                 (target.name == 'j') ? 'j' :
                 (target.name == 'k') ? 'k' :
                 null
    if (name == null) return;
    this.#quaternion[name] = value;
  }

  #enableInputs() {
    this.components.real.oninput = this.#handleInput;
    this.components.i.oninput = this.#handleInput;
    this.components.j.oninput = this.#handleInput;
    this.components.k.oninput = this.#handleInput;
  }

  get vector() {
    return this.#quaternion;
  }

  async connectedCallback() {
    this.innerHTML = this.#template;
    this.components = {
      real: this.querySelector('.real'),
      i: this.querySelector('.i'),
      j: this.querySelector('.j'),
      k: this.querySelector('.k'),
    };

    this.#enableInputs();
  }

  async disconnectedCallback() { }
}

customElements.define('edit-quaternion', Quaternion);
