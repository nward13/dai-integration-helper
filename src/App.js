import React, { Component } from 'react';
import logo from './assets/logo.svg';
// import Web3 from 'web3';

// Components
import DaiTestchainService from './DaiTestchainService';
import OfferMaker from './js/components/OfferMaker';
import OfferList from './js/components/OfferList';
import Seeder from './js/components/Seeder';

// Styles and Bootstrap Components
import './css/App.css';
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
// import '../node_modules/react-bootstrap-table/dist/react-bootstrap-table-all.min.css'

// const DaiTestchainService = require('./DaiTestchainService');
// import {DaiTestchainService} from './DaiTestchainService'; 
 
// import * as DaiTestChainService from './DaiTestchainService';
// import DaiTestchainService = require('./DaiTestchainService');

//////
// sudo sysctl fs.inotify.max_user_watches=999999999
//////


export default class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      dts: null,
      daiForWeth: true,
      numDFWOffers: 5,
      numWFDOffers: 5,
    }

    this.switchHandler = this.switchHandler.bind(this);
  }

  async componentWillMount() {
    // TODO: don't need to get web3 here, just instantiate DaiTestchainServie
    // and store object in state
    // Set Web3 provider to the dai.js testchain instance (localhost:2000)

    // const web3 = await new Web3(new Web3.providers.HttpProvider("http://localhost:2000"))
    //   .catch(error => {console.log("Problem finding web3. Error:", error)});
    // this.setState({
    //   web3: web3
    // });

    const newDts = new DaiTestchainService();
    this.setState({
      dts: newDts,
    });
  }

  switchHandler(event) {
    event.preventDefault();
    this.setState(prevState => ({
      daiForWeth: !prevState.daiForWeth
    }));
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Dai Integration Market Maker</h1>
        </header>
        <p className="App-intro">
          Instructions coming soon.
        </p>
        <OfferMaker 
          dts={this.state.dts} 
          daiForWeth={this.state.daiForWeth} 
          switchHandler={this.switchHandler} 
        />
        <Seeder dts={this.state.dts} />
        <OfferList
          dts={this.state.dts}
          daiForWethOffers={true}
          numOffers={this.state.numDFWOffers}
        />
        <OfferList
          dts={this.state.dts}
          daiForWethOffers={false}
          numOffers={this.state.numWFDOffers}
        />
      </div>
    );
  }
}
