import * as THREE from 'three';

class Status extends HTMLElement {

  #template =
    `<div class="armstatus">
        <h2>Arm Status</h2>
        <p class="online">
            <span>Online:</span>
            <span class="val"></span>
        </p>
        <p class="send">
            <span>Can sending:</span>
            <span class="val"></span>
        </p>
        <p class="shoulder">
            <span>Shoulder:</span>
            <span class="val"></span>
        </p>
        <p class="elbow">
            <span>Elbow:</span>
            <span class="val"></span>
        </p> 
        <p class="wrist">
            <span>Wrist:</span>
            <span class="val"></span>
        </p>
        <p class="claw">
          <span>Claw:</span>
          <span class="val"></span>
        </p> 
    </div>
    `;

  constructor() {
    super();
    this.innerHTML = this.#template;
    this.components = {
      sendVal: this.querySelector('.send .val'),
      shoulderVal: this.querySelector('.shoulder .val'),
      elbowVal: this.querySelector('.elbow .val'),
      wristVal: this.querySelector('.wrist .val'),
      clawVal: this.querySelector('.claw .val'),
      onlineVal: this.querySelector('.online .val'),
    };
  }

  #setState(component, state) {    
    if (state) {
      component.classList.remove('failed');
      component.classList.add('ok');
    } else {
      component.classList.add('failed');
      component.classList.remove('ok');
    }
  }

  setStatus(status) {
    if (this.components == null) return;
    this.#setState(this.components.onlineVal, status.online);
    this.#setState(this.components.sendVal, status.canSendOK);
    this.#setState(this.components.shoulderVal, status.shoulderOK);
    this.#setState(this.components.elbowVal, status.elbowOK);
  }

  async connectedCallback() {

  }

  async disconnectedCallback() { }
}

customElements.define('arm-status', Status);
