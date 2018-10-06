import React, { Component } from 'react';
import { Form, FormGroup, Label, Button } from 'react-bootstrap'

export default class OfferMaker extends Component {

  constructor(props) {
    super(props);

    this.state = {
      dfwMarketSell: this.props.dts.eth_usd_price,
      wfdMarketSell: this.props.dts.eth_usd_price
    }
  }

  offer(event) {
    event.preventDefault();
    if (this.props.daiForWeth) {
      this.props.dts.offerDaiForWeth(
        this.refs.sellAmt.value,
        this.refs.buyAmt.value
      );
    } else {
      this.props.dts.offerWethForDai(
        this.refs.sellAmt.value,
        this.refs.buyAmt.value
      );
    }
  }

  handleMarketClick = () => {
    this.setState({
      dfwMarketSell: this.props.dts.eth_usd_price,
      wfdMarketSell: this.props.dts.eth_usd_price
    });
  }


  render() {
    let offerString = this.props.daiForWeth
                    ? "Make an offer to sell DAI for WETH"
                    : "Make an offer to sell WETH for DAI"

    const HeaderElement = () => <h3 style={{ borderRadius: '0.25em', textAlign: 'center', color: 'black', border: '1.5px solid black', padding: '0.5em' }}>{offerString}</h3>; 

    return (
      <div className="form" style={{border:"thin solid black"}}>
        <HeaderElement />
        <Button type="submit" onClick={this.props.switchHandler}>Switch offer</Button>
        <Form>
          <FormGroup>
            <Label htmlFor="sellAmount">Amount to Sell: </Label>
            {/* <input type="number" ref="sellAmt" /> */}
            <input type="number" min={0} precision={5} ref="sellAmt" />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="buyAmount">Amount to Buy: </Label>
            <input type="number" min={0} precision={5} ref="buyAmt" />
          </FormGroup>
          <input type="submit" value="Make Offer" onClick={this.offer.bind(this)} />
        </Form>
      </div>
    )
  }


}