import './App.css';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import React, { Fragment, useEffect } from 'react';
import Navbar from './components/layout/navbar';
import Landing from './components/layout/landing';
import Login from './components/auth/login';
import Register from './components/auth/register';
import Alert from './components/layout/alert';
import Dashboard from './components/dashboard/dashboard';
import Privateroute from './components/routing/privateroute';

// Redux
import { Provider } from 'react-redux';
import Store from './store';
import setAuthToken from './utils/setAuthToken';
import { Loaduser } from './actions/auth';

if (localStorage.token) {
	setAuthToken(localStorage.token);
}

const App = () => {
	useEffect(() => {
		Store.dispatch(Loaduser());
	});

	return (
		<Provider store={Store}>
			<Router>
				<Fragment>
					<Navbar />
					<Route exact path='/' component={Landing} />
					<section className='container'>
						<Alert />
						<Switch>
							<Route exact path='/register' component={Register} />
							<Route exact path='/login' component={Login} />
							<Privateroute exact path='/dashboard' component={Dashboard} />
						</Switch>
					</section>
				</Fragment>
			</Router>
		</Provider>
	);
};

export default App;
