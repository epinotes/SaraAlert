import React from 'react';
import { Button, Card, Row, Col, Alert } from 'react-bootstrap';
import { PropTypes } from 'prop-types';
import axios from 'axios';
import confirmDialog from '../util/ConfirmDialog';
import reportError from '../util/ReportError';

class Import extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      patients: props.patients,
      errors: props.errors,
      accepted: [],
      rejected: [],
      phased: [],
      progress: 0,
      importDuplicates: false,
      isPaused: false,
      acceptedAllStarted: false,
    };
    this.importAll = this.importAll.bind(this);
    this.importSub = this.importSub.bind(this);
    this.rejectSub = this.rejectSub.bind(this);
    this.handleExtraOptionToggle = this.handleExtraOptionToggle.bind(this);
    this.handleConfirm = this.handleConfirm.bind(this);
    this.submit = this.submit.bind(this);
  }

  importAll() {
    let willCreate = [];
    for (let i = 0; i < this.state.patients.length; i++) {
      if (!(this.state.accepted.includes(i) || this.state.rejected.includes(i))) {
        let patient = this.state.patients[parseInt(i)];
        if (!patient.appears_to_be_duplicate || this.state.importDuplicates) {
          willCreate.push(patient);
        }
      }
    }
    if (willCreate.length > 0) {
      this.setState({ phased: willCreate }, () => {
        this.submit(this.state.phased[0], 0, true);
      });
    } else {
      // if there are no monitorees to import, go back to root after pressing the import button
      location.href = '/';
    }
  }

  importSub(num, bypass) {
    this.submit(this.state.patients[parseInt(num)], num, bypass);
  }

  rejectSub(num) {
    let next = [...this.state.rejected, num];
    this.setState({ rejected: next });
  }

  submit(data, num, bypass) {
    const patient = { patient: { ...data } };
    axios.defaults.headers.common['X-CSRF-Token'] = this.props.authenticity_token;
    axios({
      method: 'post',
      url: window.BASE_PATH + '/patients',
      data: { ...patient, bypass_duplicate: bypass },
    })
      .then(() => {
        let next = [...this.state.accepted, num];
        this.setState({ accepted: next, progress: num }, () => {
          if (this.state.phased.length > num + 1) {
            if (!this.state.isPaused) {
              this.submit(this.state.phased[num + 1], num + 1, bypass);
            }
          } else if (this.state.phased.length != 0) {
            // if there are no monitorees to import, and import wasn't done one at a time go back to root after pressing the import button
            history.back();
          }
        });
      })
      .catch(err => {
        reportError(err);
      });
  }

  handleExtraOptionToggle(value) {
    this.setState({ importDuplicates: value });
  }

  stopImport = async () => {
    this.setState({ isPaused: true }, async () => {
      let confirmText = `This will stop the creation of new records from the list below. Records that were imported prior to clicking “Stop Import” will not be deleted from the system.`;
      if (await confirmDialog(confirmText, { title: 'Stop Import Process' })) {
        this.setState({ isPaused: false });
        location.href = '/';
      } else {
        this.setState({ isPaused: false });
        if (this.state.acceptedAllStarted) {
          this.submit(this.state.phased[this.state.progress + 1], this.state.progress + 1, true);
        }
      }
    });
  };

  handleConfirm = async confirmText => {
    this.setState({ acceptedAllStarted: true }, async () => {
      let duplicateCount = this.state.patients.filter(pat => pat.appears_to_be_duplicate == true).length;
      let duplicatePrompt = duplicateCount != 0 ? `Include the ${duplicateCount} detected duplicate monitorees` : undefined;
      if (await confirmDialog(confirmText, { title: 'Import Monitorees', extraOption: duplicatePrompt, extraOptionChange: this.handleExtraOptionToggle })) {
        this.importAll();
      } else {
        this.setState({ acceptedAllStarted: false });
      }
    });
  };

  render() {
    if (this.state.patients.length === this.state.accepted.length + this.state.rejected.length && this.state.errors.length == 0) {
      location.href = '/';
    }
    return (
      <React.Fragment>
        {this.state.errors.length != 0 && (
          <div className="m-4">
            <h5>The following errors were found in your import file, please fix them and then try re-importing.</h5>
          </div>
        )}
        {this.state.errors.map((error, index) => {
          return (
            <div className="alert alert-dismissible fade show alert-danger mt-3 mx-3" role="alert" key={`error${index}`}>
              {error}
              <button type="button" className="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
          );
        })}
        {this.state.errors.length == 0 && (
          <div className="m-4">
            {this.state.phased.length > 0 && (
              <div className="progress mb-3">
                <div
                  className="progress-bar progress-bar-striped progress-bar-animated"
                  role="progressbar"
                  aria-valuenow={this.state.progress}
                  style={{ width: Math.round((this.state.progress + 1 / this.state.phased.length) * 100) + '%' }}
                  aria-valuemin="0"
                  aria-valuemax={this.state.phased.length}></div>
              </div>
            )}
            <h5>
              Please review the monitoree records that are about to be imported. You can individually accept or reject each record below. You can also choose to
              import all unique records or all records (including duplicates) by clicking the &quot;Import All&quot; button.
            </h5>
            <Button
              variant="primary"
              className="btn-lg my-2"
              onClick={() =>
                this.handleConfirm(
                  `This will import all records listed below that you did not manually accept or reject. If potential duplicates have been detected, check the box if you would like to import them.`
                )
              }>
              Import All
            </Button>
            {this.state.acceptedAllStarted && (
              <Button variant="primary" className="btn-lg my-2 ml-2" onClick={() => this.stopImport()}>
                Stop Import
              </Button>
            )}
            {this.state.patients.map((patient, index) => {
              return (
                <Card
                  body
                  key={`p-${index}`}
                  className="card-square mt-3"
                  bg="light"
                  border={this.state.accepted.includes(index) ? 'success' : this.state.rejected.includes(index) ? 'danger' : ''}>
                  <React.Fragment>
                    {patient.appears_to_be_duplicate && <Alert variant="danger">Warning: This monitoree already appears to exist in the system!</Alert>}
                    {(patient.jurisdiction_path || patient.assigned_user) && (
                      <Alert variant="info">
                        Note:
                        {patient.jurisdiction_path && <span>{` This monitoree will be imported into '${patient.jurisdiction_path}'.`}</span>}
                        {patient.assigned_user && <span>{` This monitoree will be assigned to user '${patient.assigned_user}'.`}</span>}
                      </Alert>
                    )}
                    <Row>
                      <Col>
                        <b>State/Local ID:</b> {patient.user_defined_id_statelocal}
                        <br />
                        <b>CDC ID:</b> {patient.user_defined_id_cdc}
                        <br />
                        <b>First Name:</b> {patient.first_name}
                        <br />
                        <b>Last Name:</b> {patient.last_name}
                        <br />
                        <b>DOB:</b> {patient.date_of_birth}
                        <br />
                        <b>Language:</b> {patient.primary_language}
                        <br />
                        <b>Flight or Vessel Number:</b> {patient.flight_or_vessel_number}
                      </Col>
                      <Col>
                        <b>Home Address Line 1:</b> {patient.address_line_1}
                        <br />
                        <b>Home Town/City:</b> {patient.address_city}
                        <br />
                        <b>Home State:</b> {patient.address_state}
                        <br />
                        <b>Home Zip:</b> {patient.address_zip}
                        <br />
                        <b>Monitored Address Line 1:</b> {patient.monitored_address_line_1}
                        <br />
                        <b>Monitored Town/City:</b> {patient.monitored_address_city}
                        <br />
                        <b>Monitored State:</b> {patient.monitored_address_state}
                        <br />
                        <b>Monitored Zip:</b> {patient.monitored_address_zip}
                      </Col>
                      <Col>
                        <b>Phone Number 1:</b> {patient.primary_telephone}
                        <br />
                        <b>Phone Number 2:</b> {patient.secondary_telephone}
                        <br />
                        <b>Email:</b> {patient.email}
                        <br />
                        <b>Exposure Location:</b> {patient.potential_exposure_location}
                        <br />
                        <b>Date of Departure:</b> {patient.date_of_departure}
                        <br />
                        <b>Close Contact w/ Known Case:</b> {patient.contact_of_known_case?.toString()}
                        <br />
                        <b>Was in HC Fac. w/ Known Cases:</b> {patient.was_in_health_care_facility_with_known_cases?.toString()}
                      </Col>
                    </Row>
                  </React.Fragment>
                  {!(this.state.accepted.includes(index) || this.state.rejected.includes(index)) && (
                    <React.Fragment>
                      <Button
                        variant="danger"
                        className="my-2 ml-3 float-right"
                        onClick={() => {
                          this.rejectSub(index);
                        }}>
                        Reject
                      </Button>
                      <Button
                        variant="primary"
                        className="my-2 float-right"
                        onClick={() => {
                          this.importSub(index, true);
                        }}>
                        Accept
                      </Button>
                    </React.Fragment>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </React.Fragment>
    );
  }
}

Import.propTypes = {
  patients: PropTypes.array,
  errors: PropTypes.array,
  authenticity_token: PropTypes.string,
};

export default Import;
