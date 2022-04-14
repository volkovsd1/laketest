import React, { Fragment } from 'react'
import { FormGroup, Label, Tag, TagInput } from '@blueprintjs/core'

const MappingTag = ({ classNames, labelIntent, labelName, onChange, rightElement, helperText, typeOrStatus, values, placeholderText }) => {
  return (
    <>
      <div className='formContainer'>
        <FormGroup
            // disabled={isTesting || isSaving}
          label=''
          inline
          labelFor='jira-issue-type-mapping'
          helperText={helperText}
          className='formGroup'
          contentClassName='formGroupContent'
        >
          {labelName && (
            <Label style={{ display: 'inline' }}>
              <span style={{ marginRight: '10px' }}><Tag className={classNames} intent={labelIntent}>{labelName}</Tag></span>
            </Label>
          )}
          <TagInput
            placeholder={placeholderText}
            values={values || []}
            fill
            onChange={value => setTimeout(() => onChange([...new Set(value)]), 0)}
            addOnPaste
            addOnBlur
            rightElement={rightElement}
            onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
            className='tagInput'
          />
        </FormGroup>
      </div>
    </>
  )
}

export default MappingTag
