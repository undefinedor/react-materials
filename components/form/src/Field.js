import React from 'react';
import FormContext from './context';
import renderComponent from './renderComponent';

class Field extends React.Component {
  constructor(props, context) {
    super(props, context);
    const store = context;

    const { name, rules, linkages, status, value, format } = props;

    this.format = format;

    !!rules && store.addRules(name, rules);
    !!linkages && store.addLinkages(name, linkages);
    !!status && store.setStatus(name, status, false);

    const isCheckbox = props.type && props.type === 'checkbox';
    const isRadio = props.type && props.type === 'radio';
    if (value) {
      if (isCheckbox) {
        if (!value) {
          throw new Error('value prop is required for checkbox');
        }
        const currentValue = store.getValue(name) || [];
        if (props.checked) {
          currentValue.push(value);
        }
        store.setValueWithoutNotify(name, currentValue);
      } else if (isRadio) {
        if (props.checked) {
          store.setValueWithoutNotify(name, value);
        }
      } else {
        store.setValueWithoutNotify(name, value);
      }
    }

    this.state = {
      value: this.format ? this.format(store.getValue(name)) : store.getValue(name),
      error: store.getError(name),
      status: store.getStatus(name),
    };
  }

  componentDidMount() {
    const store = this.context;
    const { name } = this.props;
    this.unsubscribe = store.subscribe(n => {
      if (n === name || n === '*') {
        this.setState({
          value: this.format ? this.format(store.getValue(name)) : store.getValue(name),
          error: store.getError(name),
          status: store.getStatus(name),
        });
      }
    });
  }

  componentWillUnmount() {
    if (this.unsubscribe) {
      // console.log('unsubscribe')
      this.unsubscribe();
    }
  }

  handleChange = e => {
    const store = this.context;
    const { name } = this.props;

    if (e && e.target && e.target.type === 'checkbox') {
      const checked = e.target.checked;
      const value = e.target.value;
      let currentValue = store.getValue(name) || [];
      if (checked) {
        currentValue.push(value);
      } else {
        const index = currentValue.indexOf(value);
        if (index !== -1) {
          currentValue = currentValue.slice(0, index).concat(currentValue.slice(index + 1));
        }
      }
      store.setValue(name, currentValue);
    } else {
      const value = e && e.target
        ? e.target.value
        : e;
      store.setValue(name, value, store);
    }
  }

  render() {
    const { name, label, component, children, status, linkages, rules, value, format, type, ...rest } = this.props;
    if (!name) {
      console.error(
        'Warning: Must specify a name prop to a Field.'
      );
      return null;
    }
    const isCheckbox = type && (type === 'checkbox');
    const isRadio = type && (type === 'radio');
    const store = this.context;
    const state = this.state;
    const renderField = store.getRenderField();
    let renderProps = {
      name,
      label,
      component,
      children,
      renderField,
      error: state.error,
      status: state.status,
      value: (isCheckbox || isRadio) ? value : (state.value || ''),
      type,
      ...rest,
    };
    if (isCheckbox) {
      const index = state.value.indexOf(value);
      if (index < 0) {
        renderProps = { ...renderProps, checked: false };
      } else {
        renderProps = { ...renderProps, checked: true };
      }
    }
    if (component || (children && !children.props.onChange)) {
      renderProps = Object.assign({}, renderProps, { onChange: this.handleChange });
    }
    return renderComponent(renderProps);
  }
}

Field.contextType = FormContext;

export default Field;