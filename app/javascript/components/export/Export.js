import React from 'react';
import { Button, Modal } from 'react-bootstrap';
import { PropTypes } from 'prop-types';
import axios from 'axios';
import reportError from '../util/ReportError';
import { ToastContainer, toast } from 'react-toastify';

class Export extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showCSVModal: false,
      showSaraFormatModal: false,
      showAllPurgeEligibleModal: false,
      showAllModal: false,
    };
    this.submit = this.submit.bind(this);
  }

  submit(endpoint) {
    axios.defaults.headers.common['X-CSRF-Token'] = this.props.authenticity_token;
    axios({
      method: 'get',
      url: window.BASE_PATH + endpoint,
    })
      .then(() => {
        toast.success('Export has been initiated!');
        this.setState({
          showCSVModal: false,
          showSaraFormatModal: false,
          showAllPurgeEligibleModal: false,
          showAllModal: false,
        });
      })
      .catch(err => {
        reportError(err);
      });
  }

  createModal(title, toggle, submit, endpoint) {
    return (
      <Modal size="lg" show centered>
        <Modal.Header>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            After clicking <b>Start Export</b>, Sara Alert will gather all of the monitoree data that comprises your request, and generate an export file. Sara
            Alert will then send your user account an email with a one-time download link. This process may take several minutes to complete, based on the
            amount of data present.
          </p>
          <p>
            Please note that only one of each type of download per workflow will be retained for your user account. Once you use the one-time download link in
            the email you are sent, that export will be deleted. If you initiate a second export of the same type, any old ones will be overwritten. The
            download link you are sent via email is only valid for 24 hours after creation.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary btn-square"
            onClick={() => {
              submit(endpoint);
            }}>
            Start Export
          </Button>
          <Button variant="secondary btn-square" onClick={toggle}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  render() {
    return (
      <React.Fragment>
        <Button className="btn-primary mb-4 ml-2 dropdown-toggle" id="dropdownMenuButton" data-toggle="dropdown">
          <i className="fas fa-download"></i> Export
        </Button>
        <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
          <a
            className="dropdown-item"
            onClick={() => {
              this.setState({ showCSVModal: true });
            }}
            href="#">
            Line list CSV ({this.props.workflow})
          </a>
          <a
            className="dropdown-item"
            onClick={() => {
              this.setState({ showSaraFormatModal: true });
            }}
            href="#">
            Sara Alert Format ({this.props.workflow})
          </a>
          <a
            className="dropdown-item"
            onClick={() => {
              this.setState({ showAllPurgeEligibleModal: true });
            }}
            href="#">
            Excel Export For Purge-Eligible Monitorees
          </a>
          <a
            className="dropdown-item"
            onClick={() => {
              this.setState({ showAllModal: true });
            }}
            href="#">
            Excel Export For All Monitorees
          </a>
        </div>
        {this.state.showCSVModal &&
          this.createModal(
            `Line list CSV (${this.props.workflow})`,
            () => {
              this.setState({ showCSVModal: false });
            },
            this.submit,
            `/export/csv/patients/linelist/${this.props.workflow}`
          )}
        {this.state.showSaraFormatModal &&
          this.createModal(
            `Sara Alert Format (${this.props.workflow})`,
            () => {
              this.setState({ showSaraFormatModal: false });
            },
            this.submit,
            `/export/excel/patients/comprehensive/${this.props.workflow}`
          )}
        {this.state.showAllPurgeEligibleModal &&
          this.createModal(
            'Excel Export For Purge-Eligible Monitorees',
            () => {
              this.setState({ showAllPurgeEligibleModal: false });
            },
            this.submit,
            '/export/excel/patients/full_history/purgeable'
          )}
        {this.state.showAllModal &&
          this.createModal(
            'Excel Export For All Monitorees',
            () => {
              this.setState({ showAllModal: false });
            },
            this.submit,
            '/export/excel/patients/full_history/all'
          )}
        <ToastContainer position="top-center" autoClose={3000} closeOnClick pauseOnVisibilityChange draggable pauseOnHover />
      </React.Fragment>
    );
  }
}

Export.propTypes = {
  workflow: PropTypes.string,
  authenticity_token: PropTypes.string,
};

export default Export;
