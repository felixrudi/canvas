# frozen_string_literal: true

#
# Copyright (C) 2014 - present Instructure, Inc.
#
# This file is part of Canvas.
#
# Canvas is free software: you can redistribute it and/or modify it under
# the terms of the GNU Affero General Public License as published by the Free
# Software Foundation, version 3 of the License.
#
# Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
# A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
# details.
#
# You should have received a copy of the GNU Affero General Public License along
# with this program. If not, see <http://www.gnu.org/licenses/>.

class CanvasLinkedInConfig
  def self.call
    settings = Canvas::Plugin.find(:linked_in).try(:settings)
    if settings
      {
        api_key: settings[:client_id],
        secret_key: settings[:client_secret_dec]
      }.with_indifferent_access
    else
      Rails.application.credentials.linked_in_creds.dup
    end
  end
end

LinkedIn::Connection.config = CanvasLinkedInConfig
