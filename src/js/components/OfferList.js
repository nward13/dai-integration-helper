import React, { Component } from 'react';
import BootstrapTable from 'react-bootstrap-table-next';
import { Button } from 'react-bootstrap';

export default class OfferList extends Component {


  // TODO: add an event listener to listen for offer events on the OasisDEX contract,
  // force re-render when event is emitted

  constructor(props) {
    super(props);

    this.state = {
      offers: [],
      units: "ether",
      selected: [],
    }
  }


  async componentWillMount() {
    await this.updateOfferList();
    
    // TODO: Check that this works with kovan, and find a way to make it work on local net
    // HttpProvider (web3) does not support event subscription
    // Would maybe have to create 2 separate instances of the OasisDex contract, on with
    // httpProvider(wider support) and one with WebSocket Provider (supports event subscriptions)
    this.props.dts.oasisEvents.allEvents({
      fromBlock: 'latest'
    }, function(error, event) {
      if (error)
        console.log("Error subscribing to OasisDex events. Error: ", error)
      if (event) {
        console.log("EVENT: ", event);
        this.updateOfferList();
      }
    })
  }


  async updateOfferList() {
    let offers = [];
    if (this.props.daiForWethOffers){
      if (this.state.units === "ether") {
        offers = await this.props.dts.getDaiForWethOffers(this.props.numDFWOffers, "ether");
      } else {
        offers = await this.props.dts.getDaiForWethOffers(this.props.numDFWOffers, "wei");
      }
    } else {
      if (this.state.units === "ether") {
        offers = await this.props.dts.getWethForDaiOffers(this.props.numWFDOffers, "ether");
      } else {
        offers = await this.props.dts.getWethForDaiOffers(this.props.numWFDOffers, "wei");
      }
    }
    // If there are no offers in the market yet, set offers to an empty array rather than null
    if (offers === null)
      offers = []

    this.setState({
      offers: offers
    });
  }

  async handleCancelOffers() {
    const offersToCancel = this.state.selected;
    for (let i = 0; i < offersToCancel.length; i++) {
      await this.props.dts.cancel(offersToCancel[i]);
    }
    this.setState({ selected: [] });
    console.log("Canceled offers: ", offersToCancel);
  }

  handleOnSelect = (row, isSelect) => {
    if (isSelect) {
      this.setState((prevState) => ({
        selected: [...prevState.selected, row.id]
      }));
    } else {
      this.setState((prevState) => ({
        selected: prevState.selected.filter(x => x !== row.id)
      }));
    }
  }

  // TODO: NOT WORKING PROPERLY
  handleOnSelectAll = (isSelect, rows) => {
    const ids = rows.map(row => row.id);
    if (isSelect) {
      this.setState(() => ({
        selected: ids
      }));
    } else {
      this.setState(() => ({
        selected: []
      }));
    }
  }



  render() {
    const noDataText = this.props.daiForWethOffers
      ? "There are no offers to sell DAI for WETH yet. Make an offer above."
      : "There are no offers to sell WETH for DAI yet. Make an offer above."
    const headerText = this.props.daiForWethOffers
      ? "Offers to sell DAI for WETH"
      : "Offers to sell WETH for DAI"
    const buyTokenText = this.props.daiForWethOffers
      ? "Amount of WETH to buy"
      : "Amount of DAI to buy"
    // const sellTokenText = this.props.daiForWethOffers
    //   ? "Amount of DAI to sell"
    //   : "Amount of WETH to sell"

    const tableColumns = [
      {
        dataField: "id",
        text: "ID",
        headerAlign: 'center'
      }, {
        dataField: "sellAmt",
        text: "Sell Amount",
        headerAlign: 'center'
      }, {
        dataField: "sellToken",
        text: "Sell Token",
        headerAlign: 'center'
      }, {
        dataField: "buyAmt",
        text: "Buy Amount",
        headerAlign: 'center'
      }, {
        dataField: "buyToken",
        text: "Buy Token",
        headerAlign: 'center'
      }
    ]

    const HeaderElement = () => <h3 style={{ borderRadius: '0.25em', textAlign: 'center', color: 'black', border: '1.5px solid black', padding: '0.5em' }}>{headerText}</h3>;    
    
    const selectRow = { 
      mode: 'checkbox', 
      clickToSelect: true,
      selected: this.state.selected,
      onSelect: this.handleOnSelect,
      onSelectAll: this.handleOnSelectAll
    };

    return (
      <div>
        <BootstrapTable 
          keyField="id" 
          data={this.state.offers} 
          columns={tableColumns} 
          caption={<HeaderElement />}
          noDataIndication={noDataText}
          selectRow={selectRow}
          striped hover condensed
        />
        <Button type="submit" onClick={this.handleCancelOffers.bind(this)}>Cancel Selected Offers</Button>

      </div>
      
    )
  }


}