const axios = require("axios");

class FormController {
    
  /* formSpec = {
      "submissionURL": "http://esamwad.samagra.io/api/v4/form/submit",
      "name": "SampleForm",
      "messageOnSubmit": "Form submitted successfully",
      "messageOnFailure": "Form submission failed",
      "isSuccess": "async (formData) => { console.log(formData); }",
      "onFormSuccess": "async (formData) => { console.log(formData); }",
      "onFormFailure": "async (formData) => { console.log(formData); }",
      "nextFormOnSuccess": "formID2",
      "nextFormOnFailure": "formID3"
    }
    */

  /* formSpec = {
        "skipOnSuccessMessage": true,
        "prefill": {},
        "submissionURL": "http://esamwad.samagra.io/api/v4/form/submit",
        "name": "SampleForm",
        "successCheck": "async (formData) => { console.log('From isSuccess', formData.getElementsByTagName('reg_no')[0].textContent); return formData.getElementsByTagName('reg_no')[0].textContent === 'registration123'; }",
        "onSuccess": {
          "notificationMessage": "Form submitted successfully or not Maybe",
          "sideEffect": "async (formData) => { return JSON.parse(decodeURIComponent('%7B%0A%20%20%20%20%20%20%20%20%22name%22%3A%20%22DEVA%22%2C%0A%20%20%20%20%20%20%20%20%22batch%22%3A%20%222021-2023%22%2C%0A%20%20%20%20%20%20%20%20%22id%22%3A%208%2C%0A%20%20%20%20%20%20%20%20%22DOB%22%3A%20%222005-03-04%22%2C%0A%20%20%20%20%20%20%20%20%22affiliationType%22%3A%20%22NCVT%22%2C%0A%20%20%20%20%20%20%20%20%22registrationNumber%22%3A%20%22ICA211021569832%22%2C%0A%20%20%20%20%20%20%20%20%22tradeName%22%3A%20%22Electrician%22%2C%0A%20%20%20%20%20%20%20%20%22iti%22%3A%207%2C%0A%20%20%20%20%20%20%20%20%22industry%22%3A%201%2C%0A%20%20%20%20%20%20%20%20%22itiByIti%22%3A%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%22id%22%3A%207%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%22name%22%3A%20%22GITI%20Nagina%22%0A%20%20%20%20%20%20%20%20%7D%2C%0A%20%20%20%20%20%20%20%20%22industryByIndustry%22%3A%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%22id%22%3A%201%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%22name%22%3A%20%22Kaushal%20Bhawan%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%22latitude%22%3A%2030.695753%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%22longitude%22%3A%2076.872025%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%22schedules%22%3A%20%5B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22is_industry%22%3A%20true%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%5D%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D')); }",
          "next": {
            "type": "form",
            "id": "form2"
          }
        },
        "onFailure": {
          "message": "Form submission failed",
          "sideEffect": "async (formData) => { console.log(formData); }",
          "next": {
            "type": "url",
            "id": "google"
          }
        }
      }
      */

  constructor(formSpec) {
    /* Valid States:
            INITIALIZED
            FORM_SUCCESS
            FORM_FAILURE
            ON_SUBMIT_SUCCESS
            ON_SUBMIT_FAILURE
            ON_FORM_SUCCESS_COMPLETED
            ON_FORM_FAILURE_COMPLETED
        */
    this._state = "INITIALIZED";
    this._message = "";
    this.formSpec = formSpec;
    // this._parser = new DOMParser();

    this.formSpec.isSuccessExecute = () =>
      this.executeMethod(this.formSpec.successCheck);
    this.formSpec.onFormSuccessExecute = () =>
      this.executeMethod(this.formSpec.onSuccess.sideEffect);
    this.formSpec.onFormFailureExecute = () =>
      this.executeMethod(this.formSpec.onFailure.sideEffect);
  }

  async executeMethod(functionString) {
    // execute method string
    if (functionString) {
      //TODO: fix this with a sandbox
      return (0, eval)(functionString)(this.formData);
    } else {
      throw new Error("No function string provided");
    }
  }

  get state() {
    return this._state;
  }

  async processForm(formData) {
    // const doc = this._parser.parseFromString(formData, "text/xml");
    this.formData = axios
      .get("http://localhost:3002/form/parse/" + encodeURIComponent(formData))
      .then((res) => res.json()).data;
    if ((await this.formSpec.isSuccessExecute()) === true) {
      this._state = "FORM_SUCCESS";
      this._onFormSuccessData = await this.formSpec.onFormSuccessExecute();
      console.log(this._onFormFailureData);
      this._state = "ON_FORM_SUCCESS_COMPLETED";
      this.nextForm = this.formSpec.onSuccess.next;
      this._message = this.formSpec.messageOnSuccess;
    } else {
      this._state = "FORM_FAILURE";
      this._onFormFailureData = this.formSpec.onFormFailureExecute();
      this._state = "ON_FORM_FAILURE_COMPLETED";
      this.nextForm = this.formSpec.onFailure.next;
      this._message = this.formSpec.messageOnFailure;
    }

    return Promise.resolve({
      state: this._state,
      status: this._state.includes("FAILURE") ? "failure" : "success",
      message: this._message,
      nextForm: this.nextForm,
      onFormSuccessData: this._onFormSuccessData,
      onFormFailureData: this._onFormFailureData,
    });
  }

  async broadcastFormData() {
    // broadcast form data to parent window
    window.parent.postMessage(
      JSON.stringify({
        nextForm: this.nextForm,
        formData: this.formData,
        onSuccessData: this._onFormSuccessData,
        onFailureData: this._onFormFailureData,
        state: this._state,
      }),
      "*"
    );
  }

  async submit() {
    // submit form data to server
    const response = axios.post(this.formSpec.submissionURL, {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(this.formData),
    });
    // const response = await fetch(this.formSpec.submissionURL, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(this.formData),
    // });
    const data = await response.json();
    if (data.status === "success") {
      this._state = "ON_SUBMIT_SUCCESS";
    } else {
      this._state = "ON_SUBMIT_FAILURE";
    }

    return data;
  }
}

module.exports = FormController;
