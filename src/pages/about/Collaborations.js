import React from 'react';
import staticBuilder from '../../helpers/staticBuilder';
import json from '../../static/about/collaborations';

const Collaborations = () => (
  <div className="container">{staticBuilder(json)}</div>
);

export default Collaborations;