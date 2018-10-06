import React, { Component } from 'react';
import { Form, FormGroup, Label, Button } from 'react-bootstrap'

export default class Seeder extends Component {

  async seed(event) {
    event.preventDefault();
    await this.props.dts.seed(this.refs.seedCount.value);
  }


  render() {

    const HeaderElement = () => <h3 style={{ borderRadius: '0.25em', textAlign: 'center', color: 'black', border: '1.5px solid black', padding: '0.5em' }}>Seed the Market</h3>;    

    return (
      <div>
        <HeaderElement />
        <div className="form">
          <Form>
            <FormGroup>
              <Label htmlFor="numOffers">Number of Offers: </Label>
              <input type="number" min={0} precision={0} ref="seedCount" />
            </FormGroup>
            <input type="submit" value="Seed Market" onClick={this.seed.bind(this)} />
          </Form>
        </div>
      </div>
    )
  }


}
