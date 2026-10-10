import React, { useState } from 'react';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';

const EnergyObservationNotes = ({ onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState('');

  const toggle = () => setIsOpen(!isOpen);

  const handleSelect = (value) => {
    setSelected(value);
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <Dropdown isOpen={isOpen} toggle={toggle} className="mb-3">
      <DropdownToggle caret color="primary">
        {selected || 'เลือกสาเหตุ'}
      </DropdownToggle>
      <DropdownMenu>
        <DropdownItem onClick={() => handleSelect('สาเหตุ 1')}>สาเหตุ 1</DropdownItem>
        <DropdownItem onClick={() => handleSelect('สาเหตุ 2')}>สาเหตุ 2</DropdownItem>
        <DropdownItem onClick={() => handleSelect('สาเหตุ 3')}>สาเหตุ 3</DropdownItem>
        <DropdownItem onClick={() => handleSelect('สาเหตุ 4')}>สาเหตุ 4</DropdownItem>
        <DropdownItem onClick={() => handleSelect('สาเหตุ 5')}>สาเหตุ 5</DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};

export default EnergyObservationNotes;

