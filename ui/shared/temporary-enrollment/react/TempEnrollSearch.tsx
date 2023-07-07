/*
 * Copyright (C) 2023 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */
import React, {useEffect, useState} from 'react'
import {useScope as useI18nScope} from '@canvas/i18n'
// @ts-ignore
import {RadioInputGroup, RadioInput} from '@instructure/ui-radio-input'
import {Avatar} from '@instructure/ui-avatar'
import {ScreenReaderContent} from '@instructure/ui-a11y-content'
// @ts-ignore
import {Grid} from '@instructure/ui-grid'
import doFetchApi from '@canvas/do-fetch-api-effect'
import {Alert} from '@instructure/ui-alerts'
import {Text} from '@instructure/ui-text'
import {Spinner} from '@instructure/ui-spinner'
import {TextInput} from '@instructure/ui-text-input'
import {Table} from '@instructure/ui-table'

const I18n = useI18nScope('account_course_user_search')

interface Props {
  readonly user: {
    name: string
    avatar_url?: string
    id: string
  }
  page: number
  searchFail: Function
  searchSuccess: Function
  readonly canReadSIS?: boolean
  readonly accountId: string
}

export function TempEnrollSearch(props: Props) {
  // 'cc_path' | 'unique_id' | 'sis_user_id'
  const [searchType, setSearchType] = useState('cc_path')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [enrollment, setEnrollment] = useState(null)

  // user_lists.json does not always return email, sis id, and login
  const fetchUserDetails = async (user: any) => {
    try {
      const {json} = await doFetchApi({
        path: `/api/v1/users/${user.user_id}`,
        method: 'GET',
      })
      setEnrollment(json)
    } catch (error: any) {
      setMessage(error)
      setEnrollment(null)
      props.searchFail()
    }
  }

  const handleResponse = (response: any) => {
    const foundUser = response.users[0]
    if (typeof foundUser === 'undefined') {
      setMessage(I18n.t('User could not be found.'))
      setEnrollment(null)
      props.searchFail()
    } else if (response.users.length === 1 && foundUser.user_id !== props.user.id) {
      // api could return more than 1, which we don't want
      fetchUserDetails(foundUser)
      setMessage('')
      props.searchSuccess(enrollment)
    } else {
      setMessage(
        I18n.t('The user found matches the source user. Please search for a different user.')
      )
      setEnrollment(null)
      props.searchFail()
    }
  }

  const renderAvatar = () => {
    return (
      <>
        <Text weight="bold">
          {I18n.t('Find an assignee of temporary enrollments from %{name}', {
            name: props.user.name,
          })}
        </Text>
        <Grid>
          <Grid.Row vAlign="middle">
            <Grid.Col width={1}>
              <Avatar
                size="large"
                margin="small"
                name={props.user.name}
                src={props.user.avatar_url}
                data-fs-exclude={true}
                data-heap-redact-attributes="name"
              />
            </Grid.Col>
            <Grid.Col>
              <Text size="large">{props.user.name}</Text>
            </Grid.Col>
          </Grid.Row>
        </Grid>
      </>
    )
  }

  useEffect(() => {
    if (props.page === 1) {
      setLoading(true)
      const findUser = async () => {
        try {
          const {json} = await doFetchApi({
            path: `/accounts/${props.accountId}/user_lists.json`,
            method: 'POST',
            params: {user_list: search, v2: true, search_type: searchType},
          })
          handleResponse(json)
        } catch (error: any) {
          setMessage(error.message)
          setEnrollment(null)
          props.searchFail()
        } finally {
          setLoading(false)
        }
      }
      findUser()
    }
    // useEffect hook should only be triggered when page is changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.page])

  let exampleText = ''
  let labelText = ''
  let descText = ''

  switch (searchType) {
    case 'cc_path':
      exampleText = 'lsmith@myschool.edu'
      descText = I18n.t('Enter the email address of the user you would like to temporarily enroll')
      labelText = I18n.t('Email Address')
      break
    case 'unique_id':
      exampleText = 'lsmith'
      descText = I18n.t('Enter the login ID of the user you would like to temporarily enroll')
      labelText = I18n.t('Login ID')
      break
    case 'sis_user_id':
      exampleText = 'student_2708'
      descText = I18n.t('Enter the SIS ID of the user you would like to temporarily enroll')
      labelText = I18n.t('SIS ID')
      break
  }

  if (loading) {
    return <Spinner renderTitle="Retrieving user information" size="large" />
  }
  if (props.page === 1 && enrollment !== null) {
    // user confirmation page
    return (
      <>
        {renderAvatar()}
        <Alert variant="success">
          {I18n.t('This user is ready to be assigned temporary enrollments.')}
        </Alert>
        <Table caption={<ScreenReaderContent>{I18n.t('User information')}</ScreenReaderContent>}>
          <Table.Head>
            <Table.Row>
              <Table.ColHeader id="usertable-name">{I18n.t('Name')}</Table.ColHeader>
              <Table.ColHeader id="usertable-email">{I18n.t('Email Address')}</Table.ColHeader>
              <Table.ColHeader id="usertable-loginid">{I18n.t('Login ID')}</Table.ColHeader>
              {props.canReadSIS ? (
                <Table.ColHeader id="usertable-sisid">{I18n.t('SIS ID')}</Table.ColHeader>
              ) : null}
            </Table.Row>
          </Table.Head>
          <Table.Body>
            <Table.Row>
              <Table.RowHeader>{(enrollment as any).name}</Table.RowHeader>
              <Table.Cell>{(enrollment as any).email}</Table.Cell>
              <Table.Cell>{(enrollment as any).login_id}</Table.Cell>
              {props.canReadSIS ? <Table.Cell>{(enrollment as any).sis_user_id}</Table.Cell> : null}
            </Table.Row>
          </Table.Body>
        </Table>
      </>
    )
  } else {
    return (
      <>
        {renderAvatar()}
        {message === '' ? <></> : <Alert variant="error">{message}</Alert>}
        <RadioInputGroup
          name="search_type"
          defaultValue={searchType}
          description={I18n.t('Find user by')}
          onChange={(e: Event, val: string) => setSearchType(val)}
          layout="columns"
        >
          <RadioInput
            id="peoplesearch_radio_cc_path"
            key="cc_path"
            value="cc_path"
            label={I18n.t('Email Address')}
          />
          <RadioInput
            id="peoplesearch_radio_unique_id"
            key="unique_id"
            value="unique_id"
            label={I18n.t('Login ID')}
          />
          {props.canReadSIS ? (
            <RadioInput
              id="peoplesearch_radio_sis_user_id"
              key="sis_user_id"
              value="sis_user_id"
              label={I18n.t('SIS ID')}
            />
          ) : null}
        </RadioInputGroup>
        <fieldset style={{margin: '1rem 0'}}>
          <TextInput
            renderLabel={
              <>
                {labelText}
                <ScreenReaderContent>{descText}</ScreenReaderContent>
              </>
            }
            value={search}
            placeholder={exampleText}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              if (e.target !== null) {
                setSearch(e.target.value)
              }
            }}
          />
        </fieldset>
      </>
    )
  }
}