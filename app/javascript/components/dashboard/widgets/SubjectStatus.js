import React from "react"
import { Card } from 'react-bootstrap';
import { PieChart, Pie, ResponsiveContainer, Cell, Legend, Label, Tooltip } from 'recharts';

class SubjectStatus extends React.Component {

  constructor(props) {
    super(props);
  }

  render () {
    const data = [...this.props.stats.subject_status];
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#CA021A'];

    return (
      <React.Fragment>
        <Card className="card-square">
          <Card.Header as="h5">Subject Status</Card.Header>
          <Card.Body>
            <div style={{ width: '100%', height: 260 }} className="recharts-wrapper">
              <ResponsiveContainer>
                <PieChart onMouseEnter={this.onPieEnter}>
                  <Pie
                    data={data}
                    innerRadius={70}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                    label
                  >
                    {
                      data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)
                    }
                    <Label className="display-5" value={this.props.stats.system_subjects} position="center" />
                  </Pie>
                  <Legend layout="vertical" align="right" verticalAlign="middle" />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>
      </React.Fragment>
    );
  }
}

export default SubjectStatus